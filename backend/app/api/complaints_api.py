"""JWT-protected complaint workflow endpoints for Praxis."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field

from backend.app.auth_real import get_current_user
from backend.app.complaints import (
    ComplaintCreate,
    ComplaintNotFoundError,
    ComplaintRecord,
    approve_complaint,
    attach_decision,
    create_complaint,
    get_complaint,
    list_complaints,
    list_complaints_for_role,
    reject_complaint,
)
from backend.app.core.rate_limit import limiter
from backend.app.decision_engine import NoFeasibleActionError, evaluate_decision
from backend.app.formal_engine import MaintenanceRequest
from backend.app.models import MachineState, MachineStatus, OperationalConstraints

router = APIRouter(prefix="/complaints", tags=["complaints"])
_APPROVER_ROLES = {"maintenance_supervisor", "production_supervisor", "plant_manager"}
CurrentUser = Annotated[dict[str, object], Depends(get_current_user)]


def _require_role(current_user: dict[str, object], allowed: set[str]) -> str:
    role = str(current_user["role"])
    if role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role is not authorised for this action.")
    return role


def _tenant(current_user: dict[str, object]) -> str:
    return str(current_user["tenant_id"])


def _not_found(complaint_id: UUID) -> HTTPException:
    # Identical response for "does not exist" and "belongs to another tenant".
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Complaint {complaint_id} not found.")


def _get_or_404(complaint_id: UUID, current_user: dict[str, object]) -> ComplaintRecord:
    record = get_complaint(complaint_id, tenant_id=_tenant(current_user))
    if record is None:
        raise _not_found(complaint_id)
    return record


class ActionBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    comment: str = Field(default="", max_length=2_000)


@router.post("", response_model=ComplaintRecord, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def submit_complaint(request: Request, payload: ComplaintCreate, current_user: CurrentUser) -> ComplaintRecord:
    _require_role(current_user, {"technician"})
    return create_complaint(
        payload, submitted_by=str(current_user["email"]), tenant_id=_tenant(current_user)
    )


@router.get("", response_model=list[ComplaintRecord])
def get_complaints(current_user: CurrentUser) -> list[ComplaintRecord]:
    role = str(current_user["role"])
    if role == "technician":
        return list_complaints(tenant_id=_tenant(current_user), submitted_by=str(current_user["email"]))
    _require_role(current_user, _APPROVER_ROLES)
    return list_complaints_for_role(role, tenant_id=_tenant(current_user))


@router.get("/{complaint_id}", response_model=ComplaintRecord)
def get_one_complaint(complaint_id: UUID, current_user: CurrentUser) -> ComplaintRecord:
    _require_role(current_user, _APPROVER_ROLES | {"technician"})
    record = _get_or_404(complaint_id, current_user)
    if current_user["role"] == "technician" and record.submitted_by != current_user["email"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Complaint is not yours.")
    return record


@router.post("/{complaint_id}/evaluate", response_model=ComplaintRecord)
@limiter.limit("20/minute")
def evaluate_complaint(request: Request, complaint_id: UUID, current_user: CurrentUser) -> ComplaintRecord:
    _require_role(current_user, {"maintenance_supervisor"})
    record = _get_or_404(complaint_id, current_user)
    maintenance_request = MaintenanceRequest(machine_id=record.machine_id, maintenance_type="CORRECTIVE", priority="HIGH" if record.severity in ("HIGH", "CRITICAL") else "MEDIUM", condition=record.severity if record.severity in ("NORMAL", "WARN", "ALERT", "CRITICAL") else "WARN", action="REPAIR")
    machine_state = MachineState(temperature_c=85.0, vibration_mm_s=5.0, operating_hours=500, status=MachineStatus.DEGRADED)
    constraints = OperationalConstraints(max_budget=100_000, max_downtime_hours=24.0, deadline_hours=48.0, technicians_available=True, spare_parts_available=True)
    try:
        artifacts = evaluate_decision(maintenance_request, machine_state, constraints)
    except NoFeasibleActionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"code": "NO_FEASIBLE_ACTION", "message": str(exc)}) from exc
    raw_cost = float(artifacts.decision.expected_cost)
    decision_dict = artifacts.decision.model_dump(mode="json")

    # Severity-scaled cost estimate. Which approvers are required is decided
    # by the tenant's ApprovalThresholds inside attach_decision().
    if record.severity == "CRITICAL":
        cost = max(raw_cost * 8.0, 58_000.0)
    elif record.severity == "HIGH":
        cost = max(raw_cost * 3.5, 24_500.0)
    elif record.severity == "MEDIUM":
        cost = max(raw_cost * 2.0, 14_000.0)
    else:  # LOW
        cost = min(raw_cost, 7_500.0)

    decision_dict["expected_cost"] = round(cost, 2)
    try:
        return attach_decision(complaint_id, decision_dict, round(cost, 2), tenant_id=_tenant(current_user))
    except ComplaintNotFoundError as exc:
        raise _not_found(complaint_id) from exc


@router.post("/{complaint_id}/approve", response_model=ComplaintRecord)
@limiter.limit("30/minute")
def approve(request: Request, complaint_id: UUID, current_user: CurrentUser, body: ActionBody | None = None) -> ComplaintRecord:
    role = _require_role(current_user, _APPROVER_ROLES)
    # Tenant gate: a complaint from another company is reported as not found.
    _get_or_404(complaint_id, current_user)
    try:
        return approve_complaint(
            complaint_id, str(current_user["email"]), role, body.comment if body else "",
            tenant_id=_tenant(current_user),
        )
    except ComplaintNotFoundError as exc:
        raise _not_found(complaint_id) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{complaint_id}/reject", response_model=ComplaintRecord)
@limiter.limit("30/minute")
def reject(request: Request, complaint_id: UUID, current_user: CurrentUser, body: ActionBody | None = None) -> ComplaintRecord:
    role = _require_role(current_user, _APPROVER_ROLES)
    _get_or_404(complaint_id, current_user)
    try:
        return reject_complaint(
            complaint_id, str(current_user["email"]), role, body.comment if body else "",
            tenant_id=_tenant(current_user),
        )
    except ComplaintNotFoundError as exc:
        raise _not_found(complaint_id) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
