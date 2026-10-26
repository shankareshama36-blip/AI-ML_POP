"""Password and JWT helpers for Praxis's local authentication."""

from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from uuid import UUID

import bcrypt
from fastapi import Header, HTTPException, status
from jose import JWTError, jwt

from backend.app.config import JWT_ALGORITHM, JWT_EXPIRE_HOURS, JWT_SECRET

COMMON_PASSWORDS = {
    "password", "12345678", "qwerty", "abc123", "password1",
    "123456", "1234567", "123456789", "1234567890", "12345",
    "password123", "password12", "passw0rd", "pass1234", "admin",
    "administrator", "admin123", "welcome", "welcome1", "welcome123",
    "letmein", "changeme", "monkey", "dragon", "baseball",
    "football", "superman", "batman", "starwars", "princess",
    "sunshine", "shadow", "master", "killer", "trustno1",
    "computer", "michelle", "jessica", "charlie", "hunter2",
    "mustang", "michael", "jordan", "daniel", "robert",
    "thomas", "hockey", "soccer", "secret", "default",
    "guest", "system", "root", "testing", "test1234",
    "qwertyuiop", "asdfghjkl", "zxcvbnm", "111111", "123123",
    "654321", "login", "access", "master123", "coffee",
    "whatever", "iloveyou", "iloveu", "forever", "matrix",
    "internet", "freedom", "superstar", "champion", "winner",
    "security", "passcode", "service", "support", "database",
    "oracle", "cisco", "network", "server", "gateway",
    "terminal", "operator", "manager", "engineer", "technician",
    "supervisor", "plantmanager", "maint123", "tech123", "prod123",
    "plant123", "praxis123", "warehouse", "factory",
    "machine", "industry", "production", "maintenance", "assembly",
    "control", "sensor", "hardware", "software", "firmware",
    "account", "customer", "visitor", "standard", "testing123",
    "sample123", "demo1234", "demopass", "temp1234", "temppass",
}


def validate_password(password: str) -> None:
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters")
    if len(password) > 128:
        raise ValueError("Password must be at most 128 characters")
    if password.lower() in COMMON_PASSWORDS:
        raise ValueError("Password is too common")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain an uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain a lowercase letter")
    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain a digit")
    if not re.search(r"[^A-Za-z0-9]", password):
        raise ValueError("Password must contain a symbol")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_jwt(
    user_id: int,
    role: str,
    tenant_id: UUID | str,
    expires_hours: int = JWT_EXPIRE_HOURS,
) -> str:
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET must be configured before issuing tokens")
    expires_at = datetime.now(UTC) + timedelta(hours=expires_hours)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "tenant_id": str(tenant_id), "exp": expires_at},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def verify_jwt(token: str) -> dict[str, str] | None:
    if not JWT_SECRET:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if not payload.get("sub") or not payload.get("role") or not payload.get("tenant_id"):
            return None
        UUID(str(payload["tenant_id"]))
        return payload
    except (JWTError, ValueError):
        return None


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, object]:
    """Resolve a bearer token into the current user, including their tenant.

    The token's ``tenant_id`` claim must match the user's persisted tenant, so a
    token can never be used to act inside a workspace the user doesn't belong to.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    payload = verify_jwt(authorization.removeprefix("Bearer ").strip())
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    from backend.app.db import SessionLocal, User

    with SessionLocal() as session:
        user = session.get(User, int(payload["sub"]))
        if (
            user is None
            or user.tenant_id is None
            or user.role != payload["role"]
            or str(user.tenant_id) != str(UUID(str(payload["tenant_id"])))
        ):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user token")
        return {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "tenant_id": str(user.tenant_id),
            "company_name": user.company_name,
            "is_admin": bool(user.is_admin),
        }
