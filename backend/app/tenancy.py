"""Tenant-scoped services: approval thresholds and workspace administration.

Every function takes an explicit ``tenant_id`` – there is intentionally no way
to read or mutate another tenant's configuration through this module.
"""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from backend.app.config import DEFAULT_TIER1_MAX, DEFAULT_TIER2_MAX
from backend.app.db import (
    ApprovalThresholds,
    SessionLocal,
    Tenant,
    User,
    generate_invite_code,
)


def as_tenant_uuid(tenant_id: UUID | str) -> UUID:
    """Normalise a tenant id coming from a JWT claim or the ORM."""
    return tenant_id if isinstance(tenant_id, UUID) else UUID(str(tenant_id))


@dataclass(frozen=True)
class Thresholds:
    tier1_max: float
    tier2_max: float

    def as_dict(self) -> dict[str, float]:
        return {"tier1_max": self.tier1_max, "tier2_max": self.tier2_max}


def get_thresholds(tenant_id: UUID | str) -> Thresholds:
    """Return the tenant's persisted thresholds, creating the default row if absent."""
    tid = as_tenant_uuid(tenant_id)
    with SessionLocal() as session:
        row = session.get(ApprovalThresholds, tid)
        if row is None:
            if session.get(Tenant, tid) is None:
                session.add(Tenant(id=tid, name="Workspace", invite_code=generate_invite_code()))
                session.flush()
            row = ApprovalThresholds(
                tenant_id=tid, tier1_max=DEFAULT_TIER1_MAX, tier2_max=DEFAULT_TIER2_MAX
            )
            session.add(row)
            session.commit()
        return Thresholds(tier1_max=float(row.tier1_max), tier2_max=float(row.tier2_max))


def update_thresholds(
    tenant_id: UUID | str, tier1_max: float, tier2_max: float, updated_by: str
) -> Thresholds:
    if not 0 < tier1_max < tier2_max:
        raise ValueError("Thresholds must satisfy 0 < tier1_max < tier2_max")
    tid = as_tenant_uuid(tenant_id)
    with SessionLocal() as session:
        row = session.get(ApprovalThresholds, tid)
        if row is None:
            if session.get(Tenant, tid) is None:
                session.add(Tenant(id=tid, name="Workspace", invite_code=generate_invite_code()))
                session.flush()
            row = ApprovalThresholds(tenant_id=tid)
            session.add(row)
        row.tier1_max = round(float(tier1_max), 2)
        row.tier2_max = round(float(tier2_max), 2)
        row.updated_by = updated_by
        session.commit()
        return Thresholds(tier1_max=float(row.tier1_max), tier2_max=float(row.tier2_max))


@dataclass(frozen=True)
class WorkspaceMember:
    email: str
    role: str
    is_admin: bool


@dataclass(frozen=True)
class Workspace:
    tenant_id: str
    company_name: str
    invite_code: str
    members: list[WorkspaceMember]


def get_workspace(tenant_id: UUID | str) -> Workspace:
    tid = as_tenant_uuid(tenant_id)
    with SessionLocal() as session:
        tenant = session.get(Tenant, tid)
        if tenant is None:
            raise LookupError("Workspace not found")
        members = (
            session.query(User)
            .filter(User.tenant_id == tid)
            .order_by(User.created_at.asc(), User.id.asc())
            .all()
        )
        return Workspace(
            tenant_id=str(tenant.id),
            company_name=tenant.name,
            invite_code=tenant.invite_code,
            members=[WorkspaceMember(m.email, m.role, bool(m.is_admin)) for m in members],
        )


def rotate_invite_code(tenant_id: UUID | str) -> Workspace:
    tid = as_tenant_uuid(tenant_id)
    with SessionLocal() as session:
        tenant = session.get(Tenant, tid)
        if tenant is None:
            raise LookupError("Workspace not found")
        tenant.invite_code = generate_invite_code()
        session.commit()
    return get_workspace(tid)
