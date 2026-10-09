"""In-memory complaint workflow for AM&POP."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel

from backend.app.auth import get_approval_chain

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

_STATUS_ORDER = [
    "PENDING_MAINT",
    "PENDING_PROD",
    "PENDING_PLANT",
    "APPROVED",
    "REJECTED",
]

_ROLE_TO_STATUS: dict[str, str] = {
    "maintenance_supervisor": "PENDING_MAINT",
    "production_supervisor": "PENDING_PROD",
    "plant_manager": "PENDING_PLANT",
}

class ComplaintCreate(BaseModel):
    machine_id: str
    problem_type: str
    severity: str  # LOW | MEDIUM | HIGH | CRITICAL
    notes: str = ""


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


# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------

COMPLAINTS: dict[UUID, ComplaintRecord] = {}


# ---------------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------------


def create_complaint(payload: ComplaintCreate, submitted_by: str) -> ComplaintRecord:
    record = ComplaintRecord(
        complaint_id=uuid4(),
        machine_id=payload.machine_id,
        problem_type=payload.problem_type,
        severity=payload.severity,
        notes=payload.notes,
        submitted_by=submitted_by,
        submitted_at=datetime.now(UTC),
        status="PENDING_MAINT",
        decision=None,
        approval_chain=[],
        approvals=[],
    )
    COMPLAINTS[record.complaint_id] = record
    return record


def list_complaints() -> list[ComplaintRecord]:
    return list(COMPLAINTS.values())


def list_complaints_for_role(role: str) -> list[ComplaintRecord]:
    """Return complaints whose current pending step matches the given role."""
    expected_status = _ROLE_TO_STATUS.get(role)
    if expected_status is None:
        return []
    return [c for c in COMPLAINTS.values() if c.status == expected_status]


def get_complaint(complaint_id: UUID) -> ComplaintRecord | None:
    return COMPLAINTS.get(complaint_id)


def attach_decision(
    complaint_id: UUID, decision_dict: dict, expected_cost: float
) -> ComplaintRecord:
    record = COMPLAINTS[complaint_id]
    chain = get_approval_chain(expected_cost)
    updated = record.model_copy(
        update={
            "decision": decision_dict,
            "approval_chain": chain,
            "status": "PENDING_MAINT",
        }
    )
    COMPLAINTS[complaint_id] = updated
    return updated


def approve_complaint(
    complaint_id: UUID, username: str, role: str, comment: str = ""
) -> ComplaintRecord:
    record = COMPLAINTS[complaint_id]

    if record.status in ("APPROVED", "REJECTED"):
        raise ValueError(f"Complaint is already in final state: {record.status}")

    expected_status = _ROLE_TO_STATUS.get(role)
    if expected_status is None or record.status != expected_status:
        raise ValueError(
            f"Role '{role}' cannot approve a complaint in status '{record.status}'"
        )
    if role not in record.approval_chain:
        raise ValueError(f"Role '{role}' is not in the approval chain")

    entry = {
        "role": role,
        "username": username,
        "timestamp": datetime.now(UTC).isoformat(),
        "action": "APPROVED",
        "comment": comment,
    }
    new_approvals = record.approvals + [entry]

    current_index = record.approval_chain.index(role)
    next_status = (
        _ROLE_TO_STATUS[record.approval_chain[current_index + 1]]
        if current_index + 1 < len(record.approval_chain)
        else "APPROVED"
    )

    updated = record.model_copy(
        update={"approvals": new_approvals, "status": next_status}
    )
    COMPLAINTS[complaint_id] = updated
    return updated


def reject_complaint(
    complaint_id: UUID, username: str, role: str, comment: str = ""
) -> ComplaintRecord:
    record = COMPLAINTS[complaint_id]

    if record.status in ("APPROVED", "REJECTED"):
        raise ValueError(f"Complaint is already in final state: {record.status}")

    if role not in record.approval_chain:
        raise ValueError(f"Role '{role}' is not in the approval chain")

    entry = {
        "role": role,
        "username": username,
        "timestamp": datetime.now(UTC).isoformat(),
        "action": "REJECTED",
        "comment": comment,
    }
    new_approvals = record.approvals + [entry]
    updated = record.model_copy(
        update={"approvals": new_approvals, "status": "REJECTED"}
    )
    COMPLAINTS[complaint_id] = updated
    return updated
