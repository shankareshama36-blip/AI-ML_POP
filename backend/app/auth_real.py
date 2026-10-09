"""Password and JWT helpers for AM&POP's local authentication."""

from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta

import bcrypt
from fastapi import Header, HTTPException, status
from jose import JWTError, jwt

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_jwt(user_id: int, role: str, expires_hours: int = 168) -> str:
    expires_at = datetime.now(UTC) + timedelta(hours=expires_hours)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "exp": expires_at},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def verify_jwt(token: str) -> dict[str, str] | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if not payload.get("sub") or not payload.get("role"):
            return None
        return payload
    except JWTError:
        return None


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, object]:
    """Resolve an Authorization bearer token into the current database user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    payload = verify_jwt(authorization.removeprefix("Bearer ").strip())
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    from backend.app.db import SessionLocal, User

    with SessionLocal() as session:
        user = session.get(User, int(payload["sub"]))
        if user is None or user.role != payload["role"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user token")
        return {"id": user.id, "email": user.email, "role": user.role}
