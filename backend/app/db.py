"""SQLAlchemy persistence for Praxis (SQLite locally, PostgreSQL-ready).

Multi-tenancy model
-------------------
Every company workspace is a ``Tenant``. Users and complaints carry a
``tenant_id`` and every data-access path filters on it. All schema and query
logic is expressed through the SQLAlchemy ORM / Core constructs so the same
code runs unchanged on SQLite and PostgreSQL.
"""

from __future__ import annotations

import os
import secrets
import uuid
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Uuid,
    create_engine,
    false,
    inspect,
)
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.schema import CreateColumn, ExecutableDDLElement

from backend.app.config import (
    DEFAULT_TIER1_MAX,
    DEFAULT_TIER2_MAX,
    DEMO_ACCOUNTS_ENABLED,
)


def _normalise_database_url(url: str) -> str:
    """Render/Heroku expose ``postgres://`` URLs; SQLAlchemy requires ``postgresql://``."""
    if url.startswith("postgres://"):
        return "postgresql://" + url.removeprefix("postgres://")
    return url


DATABASE_URL = _normalise_database_url(os.getenv("DATABASE_URL", "sqlite:///./data/praxis.db"))
if DATABASE_URL.startswith("sqlite:///./"):
    Path(DATABASE_URL.removeprefix("sqlite:///./")).parent.mkdir(parents=True, exist_ok=True)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


ALLOWED_ROLES = (
    "explorer",
    "creator",
    "researcher",
    "business_owner",
    "technician",
    "maintenance_supervisor",
    "production_supervisor",
    "plant_manager",
)


class Base(DeclarativeBase):
    pass


class Tenant(Base):
    """A company workspace. The unit of data isolation."""

    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120))
    # Secret, rotatable code an admin shares so colleagues can join the workspace.
    invite_code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    auto_approve_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), default="", server_default="")
    clerk_user_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    role: Mapped[str] = mapped_column(String(64), default="business_owner", server_default="business_owner")
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tenants.id"), index=True, nullable=False
    )
    company_name: Mapped[str] = mapped_column(String(120), default="", server_default="")
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ComplaintWorkflow(Base):
    """Durable complaint workflow state and approval audit entries."""

    __tablename__ = "complaint_workflows"

    complaint_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tenants.id"), index=True, nullable=False
    )
    machine_id: Mapped[str] = mapped_column(String(64), index=True)
    problem_type: Mapped[str] = mapped_column(String(120))
    severity: Mapped[str] = mapped_column(String(16))
    notes: Mapped[str] = mapped_column(String(2_000), default="")
    submitted_by: Mapped[str] = mapped_column(String(255), index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(32), index=True)
    decision: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    approval_chain: Mapped[list[str]] = mapped_column(JSON, default=list)
    approvals: Mapped[list[dict]] = mapped_column(JSON, default=list)


class ApprovalThresholds(Base):
    """Per-tenant cost thresholds that drive the multi-tier approval chain.

    cost <  tier1_max            -> Maintenance Supervisor only
    tier1_max <= cost < tier2_max -> + Production Supervisor
    cost >= tier2_max            -> + Plant Manager
    """

    __tablename__ = "approval_thresholds"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tenants.id"), primary_key=True
    )
    tier1_max: Mapped[float] = mapped_column(
        Numeric(14, 2, asdecimal=False), default=DEFAULT_TIER1_MAX
    )
    tier2_max: Mapped[float] = mapped_column(
        Numeric(14, 2, asdecimal=False), default=DEFAULT_TIER2_MAX
    )
    updated_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )


# ── Tenant helpers ──────────────────────────────────────────────────────────

DEMO_TENANT_ID = uuid.uuid5(uuid.NAMESPACE_DNS, "demo-tenant.praxis.local")
DEMO_COMPANY_NAME = "Praxis Demo Plant"
DEFAULT_TEST_TENANT_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")
DEFAULT_TEST_COMPANY_NAME = "Test Company"
# Holds legacy complaints whose submitter no longer exists. No user belongs to
# it, so such records are never visible to any tenant.
QUARANTINE_TENANT_ID = uuid.uuid5(uuid.NAMESPACE_DNS, "quarantine-tenant.praxis.local")


def generate_invite_code() -> str:
    return secrets.token_urlsafe(12)


def create_tenant(session: Session, name: str, *, tenant_id: uuid.UUID | None = None) -> Tenant:
    """Create a workspace and its default approval thresholds in the caller's transaction."""
    tid = tenant_id or uuid.uuid4()
    tenant = session.get(Tenant, tid)
    if tenant is None:
        tenant = Tenant(id=tid, name=name, invite_code=generate_invite_code())
        session.add(tenant)
        session.flush()
    if session.get(ApprovalThresholds, tenant.id) is None:
        session.add(
            ApprovalThresholds(
                tenant_id=tenant.id, tier1_max=DEFAULT_TIER1_MAX, tier2_max=DEFAULT_TIER2_MAX
            )
        )
        session.flush()
    return tenant


def _ensure_tenant(session: Session, tenant_id: uuid.UUID, name: str) -> Tenant:
    tenant = session.get(Tenant, tenant_id)
    if tenant is None:
        tenant = create_tenant(session, name, tenant_id=tenant_id)
    elif session.get(ApprovalThresholds, tenant_id) is None:
        session.add(
            ApprovalThresholds(
                tenant_id=tenant_id, tier1_max=DEFAULT_TIER1_MAX, tier2_max=DEFAULT_TIER2_MAX
            )
        )
        session.flush()
    return tenant


# ── Demo data ───────────────────────────────────────────────────────────────

DEMO_ACCOUNTS = (
    ("tech@praxis.local", "Tech@12345!", "technician"),
    ("maint@praxis.local", "Maint@12345!", "maintenance_supervisor"),
    ("prod@praxis.local", "Prod@12345!", "production_supervisor"),
    ("plant@praxis.local", "Plant@12345!", "plant_manager"),
)
_DEMO_EMAILS = frozenset(email for email, _, _ in DEMO_ACCOUNTS)


def _seed_demo_accounts() -> None:
    """Create or sync demo users inside the shared demo tenant."""
    from backend.app.auth_real import hash_password, verify_password

    with SessionLocal.begin() as session:
        tenant = _ensure_tenant(session, DEMO_TENANT_ID, DEMO_COMPANY_NAME)
        for email, password, role in DEMO_ACCOUNTS:
            user = session.query(User).filter_by(email=email).first()
            if user is None:
                user = User(email=email, password_hash=hash_password(password), role=role)
                session.add(user)
            elif not verify_password(password, user.password_hash) or user.role != role:
                user.password_hash = hash_password(password)
                user.role = role
            user.tenant_id = tenant.id
            user.company_name = tenant.name
            user.is_admin = role == "plant_manager"


# ── Schema upgrade (pre-tenancy databases) ──────────────────────────────────


class _AddColumn(ExecutableDDLElement):
    """Dialect-aware ``ALTER TABLE ... ADD COLUMN`` built from a Column object."""

    inherit_cache = False

    def __init__(self, table: Table, column: Column) -> None:
        self.table = table
        self.column = column


@compiles(_AddColumn)
def _compile_add_column(element: _AddColumn, compiler, **kw) -> str:  # type: ignore[no-untyped-def]
    table = compiler.preparer.format_table(element.table)
    column_spec = compiler.process(CreateColumn(element.column), **kw)
    return f"ALTER TABLE {table} ADD COLUMN {column_spec}"


def _upgrade_legacy_schema() -> None:
    """Add model columns missing from tables created before multi-tenancy.

    Columns are added as NULLable (existing rows cannot satisfy NOT NULL until
    they are backfilled); the ORM always writes them. Fresh databases get the
    full NOT NULL + foreign-key definition from ``create_all``.
    """
    with engine.begin() as connection:
        inspector = inspect(connection)
        for table in (Tenant.__table__, User.__table__, ComplaintWorkflow.__table__):
            if not inspector.has_table(table.name):
                continue
            existing = {column["name"] for column in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing or column.primary_key:
                    continue
                default = column.server_default.arg if column.server_default is not None else None  # type: ignore[attr-defined]
                portable = Column(column.name, column.type, nullable=True, server_default=default)
                connection.execute(_AddColumn(table, portable))
            for index in table.indexes:
                index.create(connection, checkfirst=True)


def _backfill_tenancy() -> None:
    """Assign a tenant to every pre-tenancy user and complaint.

    Legacy users each get their own workspace (never merged with strangers).
    Complaints follow their submitter's tenant, or are quarantined.
    """
    with SessionLocal.begin() as session:
        for user in session.query(User).filter(User.tenant_id.is_(None)).all():
            if user.email in _DEMO_EMAILS:
                tenant = _ensure_tenant(session, DEMO_TENANT_ID, DEMO_COMPANY_NAME)
                user.is_admin = user.role == "plant_manager"
            else:
                tenant = create_tenant(session, f"{user.email} workspace")
                user.is_admin = True
            user.tenant_id = tenant.id
            user.company_name = tenant.name
        session.flush()

        orphans = (
            session.query(ComplaintWorkflow).filter(ComplaintWorkflow.tenant_id.is_(None)).all()
        )
        if not orphans:
            return
        submitters = {row.submitted_by for row in orphans}
        owner_tenant = dict(
            session.query(User.email, User.tenant_id).filter(User.email.in_(submitters)).all()
        )
        for row in orphans:
            tenant_id = owner_tenant.get(row.submitted_by)
            if tenant_id is None:
                tenant_id = _ensure_tenant(
                    session, QUARANTINE_TENANT_ID, "Unassigned legacy records"
                ).id
            row.tenant_id = tenant_id


def init_db() -> None:
    """Create/upgrade the schema, backfill tenancy and seed demo accounts."""
    Base.metadata.create_all(bind=engine)
    _upgrade_legacy_schema()
    with SessionLocal.begin() as session:
        _ensure_tenant(session, DEFAULT_TEST_TENANT_ID, DEFAULT_TEST_COMPANY_NAME)
    if DEMO_ACCOUNTS_ENABLED:
        _seed_demo_accounts()
    _backfill_tenancy()
