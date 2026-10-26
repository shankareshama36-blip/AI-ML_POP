"""Durable, tenant-isolated complaint workflow and ordered approval chain.

Isolation contract: every public function takes a keyword-only ``tenant_id``
and every query filters on it. A complaint that belongs to another tenant is
indistinguishable from one that does not exist (``ComplaintNotFoundError``).
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field

from backend.app.auth import get_approval_chain
from backend.app.db import ComplaintWorkflow, SessionLocal
from backend.app.tenancy import Thresholds, as_tenant_uuid, get_thresholds

_ROLE_TO_STATUS = {
    "maintenance_supervisor": "PENDING_MAINT",
    "production_supervisor": "PENDING_PROD",
    "plant_manager": "PENDING_PLANT",
}


class ComplaintNotFoundError(KeyError):
    """The complaint does not exist *within the caller's tenant*."""


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


def _get_row(complaint_id: UUID, tenant_id: UUID | str) -> ComplaintWorkflow:
    tid = as_tenant_uuid(tenant_id)
    with SessionLocal() as session:
        row = (
            session.query(ComplaintWorkflow)
            .filter(
                ComplaintWorkflow.complaint_id == str(complaint_id),
                ComplaintWorkflow.tenant_id == tid,
            )
            .one_or_none()
        )
        if row is None:
            raise ComplaintNotFoundError(str(complaint_id))
        session.expunge(row)
        return row


def _save(row: ComplaintWorkflow) -> ComplaintRecord:
    with SessionLocal() as session:
        session.merge(row)
        session.commit()
        return _record(row)


def create_complaint(
    payload: ComplaintCreate, submitted_by: str, *, tenant_id: UUID | str
) -> ComplaintRecord:
    row = ComplaintWorkflow(
        complaint_id=str(uuid4()), tenant_id=as_tenant_uuid(tenant_id),
        machine_id=payload.machine_id, problem_type=payload.problem_type,
        severity=payload.severity, notes=payload.notes,
        submitted_by=submitted_by, submitted_at=datetime.now(UTC), status="PENDING_MAINT",
        decision=None, approval_chain=[], approvals=[],
    )
    return _save(row)


def list_complaints(
    *, tenant_id: UUID | str, submitted_by: str | None = None
) -> list[ComplaintRecord]:
    with SessionLocal() as session:
        query = session.query(ComplaintWorkflow).filter(
            ComplaintWorkflow.tenant_id == as_tenant_uuid(tenant_id)
        )
        if submitted_by is not None:
            query = query.filter(ComplaintWorkflow.submitted_by == submitted_by)
        return [_record(row) for row in query.order_by(ComplaintWorkflow.submitted_at.desc())]


def clear_complaints() -> None:
    """Remove workflow records for isolated tests; never exposed through the API."""
    with SessionLocal() as session:
        session.query(ComplaintWorkflow).delete()
        session.commit()


def list_complaints_for_role(role: str, *, tenant_id: UUID | str) -> list[ComplaintRecord]:
    expected_status = _ROLE_TO_STATUS.get(role)
    if expected_status is None:
        return []
    with SessionLocal() as session:
        rows = (
            session.query(ComplaintWorkflow)
            .filter(
                ComplaintWorkflow.tenant_id == as_tenant_uuid(tenant_id),
                ComplaintWorkflow.status == expected_status,
            )
            .order_by(ComplaintWorkflow.submitted_at.desc())
        )
        return [_record(row) for row in rows]


def get_complaint(complaint_id: UUID, *, tenant_id: UUID | str) -> ComplaintRecord | None:
    try:
        return _record(_get_row(complaint_id, tenant_id))
    except ComplaintNotFoundError:
        return None


def _policy_for(row: ComplaintWorkflow) -> Thresholds:
    """Thresholds governing this complaint.

    The tenant's thresholds are snapshotted onto the decision at evaluation
    time, so a later settings change never re-routes an in-flight approval.
    Complaints evaluated before snapshots existed fall back to the tenant's
    current persisted thresholds.
    """
    policy = row.decision.get("approval_policy") if isinstance(row.decision, dict) else None
    if isinstance(policy, dict) and {"tier1_max", "tier2_max"} <= policy.keys():
        return Thresholds(float(policy["tier1_max"]), float(policy["tier2_max"]))
    return get_thresholds(row.tenant_id)


def _cost_of(row: ComplaintWorkflow) -> float:
    return float(row.decision.get("expected_cost", 0.0)) if isinstance(row.decision, dict) else 0.0


def attach_decision(
    complaint_id: UUID, decision_dict: dict, expected_cost: float, *, tenant_id: UUID | str
) -> ComplaintRecord:
    row = _get_row(complaint_id, tenant_id)
    thresholds = get_thresholds(row.tenant_id)
    row.decision = {**decision_dict, "approval_policy": thresholds.as_dict()}
    row.approval_chain = get_approval_chain(expected_cost, thresholds.tier1_max, thresholds.tier2_max)
    if thresholds.auto_approve_enabled and expected_cost <= thresholds.tier1_max:
        row.status = "APPROVED"
        row.approvals = [*row.approvals, {
            "role": "autonomous_ai",
            "username": "Praxis Autonomous Agent",
            "timestamp": datetime.now(UTC).isoformat(),
            "action": "APPROVED",
            "comment": "Auto-approved by Autonomous AI mode within safety threshold",
        }]
    else:
        row.status = "PENDING_MAINT"
    return _save(row)


def _assert_authorized_step(row: ComplaintWorkflow, role: str, action: str) -> None:
    if row.status in ("APPROVED", "REJECTED"):
        raise ValueError(f"Complaint is already in final state: {row.status}")
    expected_status = _ROLE_TO_STATUS.get(role)
    if expected_status is None or row.status != expected_status:
        raise ValueError(f"Role '{role}' cannot {action} a complaint in status '{row.status}'")

    if row.decision and isinstance(row.decision, dict) and not row.approval_chain:
        policy = _policy_for(row)
        row.approval_chain = get_approval_chain(_cost_of(row), policy.tier1_max, policy.tier2_max)

    if role not in row.approval_chain:
        raise ValueError(f"Role '{role}' is not in the approval chain")


def approve_complaint(
    complaint_id: UUID, username: str, role: str, comment: str = "", *, tenant_id: UUID | str
) -> ComplaintRecord:
    row = _get_row(complaint_id, tenant_id)
    _assert_authorized_step(row, role, "approve")

    row.approvals = [*row.approvals, {
        "role": role,
        "username": username,
        "timestamp": datetime.now(UTC).isoformat(),
        "action": "APPROVED",
        "comment": comment,
    }]

    cost = _cost_of(row)
    policy = _policy_for(row)
    row.approval_chain = get_approval_chain(cost, policy.tier1_max, policy.tier2_max)

    if row.status == "PENDING_MAINT":
        row.status = "APPROVED" if cost < policy.tier1_max else "PENDING_PROD"
    elif row.status == "PENDING_PROD":
        row.status = "APPROVED" if cost < policy.tier2_max else "PENDING_PLANT"
    elif row.status == "PENDING_PLANT":
        row.status = "APPROVED"

    return _save(row)


def reject_complaint(
    complaint_id: UUID, username: str, role: str, comment: str = "", *, tenant_id: UUID | str
) -> ComplaintRecord:
    row = _get_row(complaint_id, tenant_id)
    _assert_authorized_step(row, role, "reject")
    row.approvals = [*row.approvals, {"role": role, "username": username, "timestamp": datetime.now(UTC).isoformat(), "action": "REJECTED", "comment": comment}]
    row.status = "REJECTED"
    return _save(row)
