from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from backend.app.api.auth_api import router as auth_router
from backend.app.api.complaints_api import router as complaints_router
from backend.app.api.explorer_api import router as explorer_router
from backend.app.api.settings_api import router as settings_router
from backend.app.auth_real import get_current_user
from backend.app.core.rate_limit import (
    limiter,
    rate_limit_exceeded_handler,
)
from backend.app.core.security import SecurityHeadersMiddleware
from backend.app.db import ComplaintWorkflow, SessionLocal, init_db
from backend.app.decision_engine import NoFeasibleActionError, evaluate_decision
from backend.app.formal_engine import (
    DfaValidationResult,
    MaintenanceRequest,
    validate_maintenance_request,
)
from backend.app.models import (
    Approval,
    ApprovalStatus,
    ApprovalUpdate,
    DecisionEvaluationRequest,
    DecisionWorkflowResponse,
    Experience,
    OutcomeCreate,
)
from backend.app.repository import (
    DecisionLifecycleError,
    DecisionNotFoundError,
    DecisionRepository,
)

from .config import ALLOWED_ORIGINS


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Praxis API", lifespan=lifespan)
CurrentUser = Annotated[dict[str, object], Depends(get_current_user)]
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)


@app.middleware("http")
async def cache_request_body_middleware(request: Request, call_next):
    body = await request.body()
    request.state.raw_body = body

    async def receive():
        return {"type": "http.request", "body": body}

    request._receive = receive
    return await call_next(request)

app.include_router(auth_router)
app.include_router(complaints_router)
app.include_router(settings_router)
app.include_router(explorer_router)

decision_repository = DecisionRepository()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "praxis-api"}


@app.get("/analytics/decisions-count")
@limiter.limit("60/minute")
def decisions_count(request: Request) -> dict[str, int]:
    """Public aggregate counting total decisions in DB and repository."""
    with SessionLocal() as session:
        db_count = (
            session.query(ComplaintWorkflow)
            .filter(ComplaintWorkflow.decision.isnot(None))
            .count()
        )
    return {"count": db_count + decision_repository.total_decisions_count()}


@app.post(
    "/validate/maintenance-request",
    response_model=DfaValidationResult,
)
@limiter.limit("60/minute")
def validate_maintenance_request_endpoint(
    request: Request,
    payload: MaintenanceRequest,
) -> DfaValidationResult:
    """Expose the DFA validator via the FastAPI application."""

    return validate_maintenance_request(payload)


@app.post(
    "/decisions/evaluate",
    response_model=DecisionWorkflowResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("60/minute")
def evaluate_maintenance_decision(
    request: Request,
    payload: DecisionEvaluationRequest,
    current_user: CurrentUser,
) -> DecisionWorkflowResponse:
    """Run the complete V1 decision loop and create a pending audit record."""

    formal_validation = validate_maintenance_request(payload.maintenance_request)
    if not formal_validation.accepted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "FORMAL_VALIDATION_FAILED",
                "validation": formal_validation.model_dump(mode="json"),
            },
        )

    try:
        artifacts = evaluate_decision(
            payload.maintenance_request,
            payload.machine_state,
            payload.operational_constraints,
        )
    except NoFeasibleActionError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "NO_FEASIBLE_ACTION", "message": str(error)},
        ) from error

    pending_approval = Approval(
        decision_id=artifacts.decision.decision_id,
        status=ApprovalStatus.PENDING,
        timestamp=datetime.now(UTC),
    )
    workflow = DecisionWorkflowResponse(
        request_id=payload.request_id,
        timestamp=payload.timestamp,
        formal_validation=formal_validation,
        context=artifacts.context,
        candidate_actions=artifacts.candidate_actions,
        predictions=artifacts.predictions,
        constraint_results=artifacts.constraint_results,
        optimization=artifacts.optimization,
        decision=artifacts.decision,
        approval=pending_approval,
    )
    return decision_repository.create(workflow)


@app.get("/decisions/{decision_id}", response_model=DecisionWorkflowResponse)
@limiter.limit("60/minute")
def get_decision(
    request: Request, decision_id: UUID, current_user: CurrentUser
) -> DecisionWorkflowResponse:
    """Retrieve a decision and its immutable stage-by-stage audit trail."""

    try:
        return decision_repository.get(decision_id)
    except DecisionNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
        ) from error


@app.post("/decisions/{decision_id}/approval", response_model=DecisionWorkflowResponse)
@limiter.limit("60/minute")
def update_decision_approval(
    request: Request, decision_id: UUID, payload: ApprovalUpdate, current_user: CurrentUser
) -> DecisionWorkflowResponse:
    """Record the manager's human-in-the-loop decision."""

    try:
        return decision_repository.update_approval(decision_id, payload)
    except DecisionNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
        ) from error
    except DecisionLifecycleError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(error)
        ) from error


@app.post("/decisions/{decision_id}/outcome", response_model=DecisionWorkflowResponse)
@limiter.limit("60/minute")
def record_decision_outcome(
    request: Request, decision_id: UUID, payload: OutcomeCreate, current_user: CurrentUser
) -> DecisionWorkflowResponse:
    """Record execution results and add an experience-memory entry."""

    try:
        return decision_repository.record_outcome(decision_id, payload)
    except DecisionNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
        ) from error
    except DecisionLifecycleError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(error)
        ) from error


@app.get("/experiences", response_model=list[Experience])
@limiter.limit("60/minute")
def list_experiences(request: Request, current_user: CurrentUser) -> list[Experience]:
    """Return completed decisions available to future learning stages."""

    return decision_repository.list_experiences()
