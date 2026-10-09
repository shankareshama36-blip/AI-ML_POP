"""SQLite persistence for AM&POP user accounts."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import DateTime, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

DATABASE_URL = "sqlite:///./data/am_pop.db"
Path("data").mkdir(parents=True, exist_ok=True)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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


class Complaint(Base):
    """Reserved persistent complaint link; workflow records remain in memory."""

    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)


def init_db() -> None:
    """Create tables and install the four local demo accounts once."""
    Base.metadata.create_all(bind=engine)
    from backend.app.auth_real import hash_password

    defaults = (
        ("tech@ampop.local", "Tech@12345", "technician"),
        ("maint@ampop.local", "Maint@12345", "maintenance_supervisor"),
        ("prod@ampop.local", "Prod@12345", "production_supervisor"),
        ("plant@ampop.local", "Plant@12345", "plant_manager"),
    )
    with SessionLocal() as session:
        created = []
        for email, password, role in defaults:
            if session.query(User).filter_by(email=email).first() is None:
                session.add(User(email=email, password_hash=hash_password(password), role=role))
                created.append((email, password, role))
        session.commit()
    if created:
        print("Seeded AM&POP demo accounts:")
        for email, password, role in created:
            print(f"  {email} / {password} / {role}")
