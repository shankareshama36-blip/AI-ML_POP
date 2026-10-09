"""Complaint workflow endpoints for AM&POP."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

from backend.app.complaints import (
    ComplaintCreate,
    ComplaintRecord,
    approve_complaint,
    attach_decision,
    create_complaint,
    get_complaint,
    list_complaints,
    list_complaints_for_role,
    reject_complaint,
)
from backend.app.decision_engine import NoFeasibleActionError, evaluate_decision
from backend.app.formal_engine import MaintenanceRequest
from backend.app.models import MachineState, MachineStatus, OperationalConstraints

router = APIRouter(prefix="/complaints", tags=["complaints"])

_APPROVER_ROLES = {
    "maintenance_supervisor",
    "production_supervisor",
    "plant_manager",
}
_ALL_ROLES = _APPROVER_ROLES | {"technician"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _require_role(x_role: str | None, allowed: set[str]) -> str:
    if not x_role or x_role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{x_role}' is not authorised for this action.",
        )
    return x_role


def _require_username(x_username: str | None) -> str:
    if not x_username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Username header is required.",
        )
    return x_username


def _get_or_404(complaint_id: UUID) -> ComplaintRecord:
    record = get_complaint(complaint_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint {complaint_id} not found.",
        )
    return record


# ---------------------------------------------------------------------------
# Request/response bodies
# ---------------------------------------------------------------------------


class ActionBody(BaseModel):
    comment: str = ""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("", response_model=ComplaintRecord, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    payload: ComplaintCreate,
    x_username: str | None = Header(default=None),
    x_role: str | None = Header(default=None),
) -> ComplaintRecord:
    """Submit a new maintenance complaint. Requires role=technician."""
    username = _require_username(x_username)
    _require_role(x_role, {"technician"})
    return create_complaint(payload, submitted_by=username)


@router.get("", response_model=list[ComplaintRecord])
def get_complaints(
    x_username: str | None = Header(default=None),
    x_role: str | None = Header(default=None),
) -> list[ComplaintRecord]:
    """
    List complaints scoped by role:
    - technician: only own complaints
    - approvers: complaints currently pending their role
    """
    _require_username(x_username)
    role = _require_role(x_role, _ALL_ROLES)

    if role == "technician":
        return [c for c in list_complaints() if c.submitted_by == x_username]
    return list_complaints_for_role(role)


@router.get("/{complaint_id}", response_model=ComplaintRecord)
def get_one_complaint(
    complaint_id: UUID,
    x_username: str | None = Header(default=None),
    x_role: str | None = Header(default=None),
) -> ComplaintRecord:
    """Retrieve a single complaint by ID."""
    _require_username(x_username)
    _require_role(x_role, _ALL_ROLES)
    return _get_or_404(complaint_id)


@router.post("/{complaint_id}/evaluate", response_model=ComplaintRecord)
def evaluate_complaint(
    complaint_id: UUID,
    x_username: str | None = Header(default=None),
    x_role: str | None = Header(default=None),
) -> ComplaintRecord:
    """
    Run the AM&POP decision engine on the complaint and attach the result.
    Requires an approver role (maintenance_supervisor / production_supervisor /
    plant_manager).
    """
    _require_username(x_username)
    _require_role(x_role, _APPROVER_ROLES)
    record = _get_or_404(complaint_id)

    # Build a synthetic MaintenanceRequest from the complaint
    maintenance_request = MaintenanceRequest(
        machine_id=record.machine_id,
        maintenance_type="CORRECTIVE",
        priority="HIGH" if record.severity in ("HIGH", "CRITICAL") else "MEDIUM",
        condition=record.severity if record.severity in ("NORMAL", "WARN", "ALERT", "CRITICAL") else "WARN",
        action="REPAIR",
    )
    machine_state = MachineState(
        temperature_c=85.0,
        vibration_mm_s=5.0,
        operating_hours=500,
        status=MachineStatus.DEGRADED,
    )
    operational_constraints = OperationalConstraints(
        max_budget=100_000,
        max_downtime_hours=24.0,
        deadline_hours=48.0,
        technicians_available=True,
        spare_parts_available=True,
    )

    try:
        artifacts = evaluate_decision(
            maintenance_request, machine_state, operational_constraints
        )
    except NoFeasibleActionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "NO_FEASIBLE_ACTION", "message": str(exc)},
        ) from exc

    decision_dict = artifacts.decision.model_dump(mode="json")
    expected_cost = artifacts.decision.expected_cost

    return attach_decision(complaint_id, decision_dict, expected_cost)


@router.post("/{complaint_id}/approve", response_model=ComplaintRecord)
def approve(
    complaint_id: UUID,
    body: ActionBody | None = None,
    x_username: str | None = Header(default=None),
    x_role: str | None = Header(default=None),
) -> ComplaintRecord:
    """Approve a complaint. Role must match the current pending step."""
    username = _require_username(x_username)
    role = _require_role(x_role, _APPROVER_ROLES)
    _get_or_404(complaint_id)
    comment = body.comment if body else ""
    try:
        return approve_complaint(complaint_id, username, role, comment)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc


@router.post("/{complaint_id}/reject", response_model=ComplaintRecord)
def reject(
    complaint_id: UUID,
    body: ActionBody | None = None,
    x_username: str | None = Header(default=None),
    x_role: str | None = Header(default=None),
) -> ComplaintRecord:
    """Reject a complaint. Role must be in the remaining approval chain."""
    username = _require_username(x_username)
    role = _require_role(x_role, _APPROVER_ROLES)
    _get_or_404(complaint_id)
    comment = body.comment if body else ""
    try:
        return reject_complaint(complaint_id, username, role, comment)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc
