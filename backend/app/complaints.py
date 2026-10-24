"""Durable complaint workflow and ordered approval chain."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field

from backend.app.auth import get_approval_chain
from backend.app.db import ComplaintWorkflow, SessionLocal

_ROLE_TO_STATUS = {
    "maintenance_supervisor": "PENDING_MAINT",
    "production_supervisor": "PENDING_PROD",
    "plant_manager": "PENDING_PLANT",
}


class ComplaintCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    machine_id: str = Field(min_length=1, max_length=64)
    problem_type: str = Field(min_length=1, max_length=120)
    severity: str = Field(pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    notes: str = Field(default="", max_length=2_000)


class ComplaintRecord(BaseModel):
    complaint_id: UUID
    machine_id: str
    problem_type: str
    severity: str
    notes: str
    submitted_by: str
    submitted_at: datetime
    status: str
    decision: dict | None = None
    approval_chain: list[str]
    approvals: list[dict]


def _record(row: ComplaintWorkflow) -> ComplaintRecord:
    return ComplaintRecord(
        complaint_id=UUID(row.complaint_id),
        machine_id=row.machine_id,
        problem_type=row.problem_type,
        severity=row.severity,
        notes=row.notes,
        submitted_by=row.submitted_by,
        submitted_at=row.submitted_at,
        status=row.status,
        decision=row.decision,
        approval_chain=row.approval_chain,
        approvals=row.approvals,
    )


def _get_row(complaint_id: UUID) -> ComplaintWorkflow:
    with SessionLocal() as session:
        row = session.get(ComplaintWorkflow, str(complaint_id))
        if row is None:
            raise KeyError(str(complaint_id))
        session.expunge(row)
        return row


def _save(row: ComplaintWorkflow) -> ComplaintRecord:
    with SessionLocal() as session:
        session.merge(row)
        session.commit()
        return _record(row)


def create_complaint(payload: ComplaintCreate, submitted_by: str) -> ComplaintRecord:
    row = ComplaintWorkflow(
        complaint_id=str(uuid4()), machine_id=payload.machine_id,
        problem_type=payload.problem_type, severity=payload.severity, notes=payload.notes,
        submitted_by=submitted_by, submitted_at=datetime.now(UTC), status="PENDING_MAINT",
        decision=None, approval_chain=[], approvals=[],
    )
    return _save(row)


def list_complaints() -> list[ComplaintRecord]:
    with SessionLocal() as session:
        return [_record(row) for row in session.query(ComplaintWorkflow).order_by(ComplaintWorkflow.submitted_at.desc())]


def clear_complaints() -> None:
    """Remove workflow records for isolated tests; never exposed through the API."""
    with SessionLocal() as session:
        session.query(ComplaintWorkflow).delete()
        session.commit()


def list_complaints_for_role(role: str) -> list[ComplaintRecord]:
    expected_status = _ROLE_TO_STATUS.get(role)
    if expected_status is None:
        return []
    with SessionLocal() as session:
        rows = session.query(ComplaintWorkflow).filter_by(status=expected_status).order_by(ComplaintWorkflow.submitted_at.desc())
        return [_record(row) for row in rows]


def get_complaint(complaint_id: UUID) -> ComplaintRecord | None:
    try:
        return _record(_get_row(complaint_id))
    except KeyError:
        return None


def attach_decision(complaint_id: UUID, decision_dict: dict, expected_cost: float) -> ComplaintRecord:
    row = _get_row(complaint_id)
    row.decision = decision_dict
    row.approval_chain = get_approval_chain(expected_cost)
    row.status = "PENDING_MAINT"
    return _save(row)


def _assert_authorized_step(row: ComplaintWorkflow, role: str, action: str) -> None:
    if row.status in ("APPROVED", "REJECTED"):
        raise ValueError(f"Complaint is already in final state: {row.status}")
    expected_status = _ROLE_TO_STATUS.get(role)
    if expected_status is None or row.status != expected_status:
        raise ValueError(f"Role '{role}' cannot {action} a complaint in status '{row.status}'")
    if role not in row.approval_chain:
        raise ValueError(f"Role '{role}' is not in the approval chain")


def approve_complaint(complaint_id: UUID, username: str, role: str, comment: str = "") -> ComplaintRecord:
    row = _get_row(complaint_id)
    _assert_authorized_step(row, role, "approve")
    approvals = [*row.approvals, {"role": role, "username": username, "timestamp": datetime.now(UTC).isoformat(), "action": "APPROVED", "comment": comment}]
    index = row.approval_chain.index(role)
    row.approvals = approvals
    row.status = _ROLE_TO_STATUS[row.approval_chain[index + 1]] if index + 1 < len(row.approval_chain) else "APPROVED"
    return _save(row)


def reject_complaint(complaint_id: UUID, username: str, role: str, comment: str = "") -> ComplaintRecord:
    row = _get_row(complaint_id)
    _assert_authorized_step(row, role, "reject")
    row.approvals = [*row.approvals, {"role": role, "username": username, "timestamp": datetime.now(UTC).isoformat(), "action": "REJECTED", "comment": comment}]
    row.status = "REJECTED"
    return _save(row)
