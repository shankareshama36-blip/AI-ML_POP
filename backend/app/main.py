from datetime import UTC, datetime
from uuid import UUID

from fastapi import FastAPI, HTTPException, Request, status
from slowapi.errors import RateLimitExceeded

from backend.app.core.rate_limit import (
    limiter,
    rate_limit_exceeded_handler,
)
from backend.app.core.security import add_security_middleware
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

app = FastAPI(title="AM&POP API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
add_security_middleware(app)

decision_repository = DecisionRepository()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "am-pop-api"}


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
    request: Request, decision_id: UUID
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
    request: Request, decision_id: UUID, payload: ApprovalUpdate
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
    request: Request, decision_id: UUID, payload: OutcomeCreate
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
def list_experiences() -> list[Experience]:
    """Return completed decisions available to future learning stages."""

    return decision_repository.list_experiences()
