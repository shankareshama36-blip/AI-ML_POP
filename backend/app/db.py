"""SQLite persistence for Praxis user accounts."""

from __future__ import annotations

import os
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from backend.app.config import DEMO_ACCOUNTS_ENABLED

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/praxis.db")
if DATABASE_URL.startswith("sqlite:///./"):
    Path(DATABASE_URL.removeprefix("sqlite:///./")).parent.mkdir(parents=True, exist_ok=True)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(64))
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


DEMO_ACCOUNTS = (
    ("tech@praxis.local", "Tech@12345!", "technician"),
    ("maint@praxis.local", "Maint@12345!", "maintenance_supervisor"),
    ("prod@praxis.local", "Prod@12345!", "production_supervisor"),
    ("plant@praxis.local", "Plant@12345!", "plant_manager"),
)


def _seed_demo_accounts() -> None:
    """Create or sync local demo users so credentials always match."""
    from backend.app.auth_real import hash_password, verify_password

    with SessionLocal.begin() as session:
        for email, password, role in DEMO_ACCOUNTS:
            user = session.query(User).filter_by(email=email).first()
            if user is None:
                session.add(User(email=email, password_hash=hash_password(password), role=role))
            else:
                if not verify_password(password, user.password_hash) or user.role != role:
                    user.password_hash = hash_password(password)
                    user.role = role


def init_db() -> None:
    """Create the schema and development-only demonstration accounts."""
    Base.metadata.create_all(bind=engine)
    if DEMO_ACCOUNTS_ENABLED:
        _seed_demo_accounts()
