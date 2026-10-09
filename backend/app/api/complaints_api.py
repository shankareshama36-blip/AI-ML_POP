"""JWT-protected complaint workflow endpoints for AM&POP."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.app.auth_real import get_current_user
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
_APPROVER_ROLES = {"maintenance_supervisor", "production_supervisor", "plant_manager"}
CurrentUser = Annotated[dict[str, object], Depends(get_current_user)]


def _require_role(current_user: dict[str, object], allowed: set[str]) -> str:
    role = str(current_user["role"])
    if role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role is not authorised for this action.")
    return role


def _get_or_404(complaint_id: UUID) -> ComplaintRecord:
    record = get_complaint(complaint_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Complaint {complaint_id} not found.")
    return record


class ActionBody(BaseModel):
    comment: str = ""


@router.post("", response_model=ComplaintRecord, status_code=status.HTTP_201_CREATED)
def submit_complaint(payload: ComplaintCreate, current_user: CurrentUser) -> ComplaintRecord:
    _require_role(current_user, {"technician"})
    return create_complaint(payload, submitted_by=str(current_user["email"]))


@router.get("", response_model=list[ComplaintRecord])
def get_complaints(current_user: CurrentUser) -> list[ComplaintRecord]:
    role = str(current_user["role"])
    if role == "technician":
        return [c for c in list_complaints() if c.submitted_by == current_user["email"]]
    _require_role(current_user, _APPROVER_ROLES)
    return list_complaints_for_role(role)


@router.get("/{complaint_id}", response_model=ComplaintRecord)
def get_one_complaint(complaint_id: UUID, current_user: CurrentUser) -> ComplaintRecord:
    _require_role(current_user, _APPROVER_ROLES | {"technician"})
    record = _get_or_404(complaint_id)
    if current_user["role"] == "technician" and record.submitted_by != current_user["email"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Complaint is not yours.")
    return record


@router.post("/{complaint_id}/evaluate", response_model=ComplaintRecord)
def evaluate_complaint(complaint_id: UUID, current_user: CurrentUser) -> ComplaintRecord:
    _require_role(current_user, {"maintenance_supervisor"})
    record = _get_or_404(complaint_id)
    maintenance_request = MaintenanceRequest(machine_id=record.machine_id, maintenance_type="CORRECTIVE", priority="HIGH" if record.severity in ("HIGH", "CRITICAL") else "MEDIUM", condition=record.severity if record.severity in ("NORMAL", "WARN", "ALERT", "CRITICAL") else "WARN", action="REPAIR")
    machine_state = MachineState(temperature_c=85.0, vibration_mm_s=5.0, operating_hours=500, status=MachineStatus.DEGRADED)
    constraints = OperationalConstraints(max_budget=100_000, max_downtime_hours=24.0, deadline_hours=48.0, technicians_available=True, spare_parts_available=True)
    try:
        artifacts = evaluate_decision(maintenance_request, machine_state, constraints)
    except NoFeasibleActionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"code": "NO_FEASIBLE_ACTION", "message": str(exc)}) from exc
    return attach_decision(complaint_id, artifacts.decision.model_dump(mode="json"), artifacts.decision.expected_cost)


@router.post("/{complaint_id}/approve", response_model=ComplaintRecord)
def approve(complaint_id: UUID, current_user: CurrentUser, body: ActionBody | None = None) -> ComplaintRecord:
    role = _require_role(current_user, _APPROVER_ROLES)
    _get_or_404(complaint_id)
    try:
        return approve_complaint(complaint_id, str(current_user["email"]), role, body.comment if body else "")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{complaint_id}/reject", response_model=ComplaintRecord)
def reject(complaint_id: UUID, current_user: CurrentUser, body: ActionBody | None = None) -> ComplaintRecord:
    role = _require_role(current_user, _APPROVER_ROLES)
    _get_or_404(complaint_id)
    try:
        return reject_complaint(complaint_id, str(current_user["email"]), role, body.comment if body else "")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
