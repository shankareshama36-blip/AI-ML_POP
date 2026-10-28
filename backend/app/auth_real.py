"""Password and JWT helpers for Praxis's local authentication."""

from __future__ import annotations

import os
import re
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from uuid import UUID

import bcrypt
from clerk_backend_api import Clerk, authenticate_request
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import Depends, Header, HTTPException, Request, status
from jose import JWTError, jwt

from backend.app.config import (
    CLERK_SECRET_KEY,
    ENV,
    JWT_ALGORITHM,
    JWT_EXPIRE_HOURS,
    JWT_SECRET,
)

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


class UserContext(dict):
    """Dictionary representing authenticated user, supporting attribute access."""

    def __getattr__(self, name: str):
        try:
            return self[name]
        except KeyError:
            raise AttributeError(f"'UserContext' object has no attribute '{name}'") from None


def require_role(allowed_roles: list[str] | set[str]):
    """FastAPI dependency factory enforcing RBAC based on user role."""
    allowed = {r.lower() for r in allowed_roles}

    def _role_checker(
        current_user: dict[str, object] = Depends(get_current_user),
    ) -> dict[str, object]:
        role = str(current_user.get("role", "")).lower()
        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Role is not authorised for this action.",
            )
        return current_user

    return _role_checker


class _HeaderAuthWrapper:
    def __init__(self, headers: Mapping[str, str]) -> None:
        self._headers = headers

    @property
    def headers(self) -> Mapping[str, str]:
        return self._headers


def get_current_user_clerk(
    request: Request = None,  # type: ignore[assignment]
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    """Resolve a Clerk bearer token into the current user, including tenant and role.

    Verifies the token via Clerk SDK, extracts 'sub' (clerk_user_id), and loads
    the corresponding multi-tenant user from the database.
    """
    auth_header = authorization
    if not auth_header and request is not None:
        auth_header = request.headers.get("authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    raw_token = auth_header.removeprefix("Bearer ").strip()
    clerk_user_id: str | None = None
    email_from_token: str | None = None

    if CLERK_SECRET_KEY:
        req_obj = request if request is not None else _HeaderAuthWrapper({"authorization": auth_header})
        opts = AuthenticateRequestOptions(secret_key=CLERK_SECRET_KEY)
        state = authenticate_request(req_obj, opts)
        if not state.is_authenticated or not state.payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Clerk token: {state.reason or 'unauthorized'}",
            )
        clerk_user_id = str(state.payload.get("sub", "")).strip() or None
        email_from_token = state.payload.get("email") or state.payload.get("email_address")
    else:
        # Fallback for local development or testing when secret key is unset
        if os.getenv("ENVIRONMENT") == "production" or ENV == "production":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Clerk authentication failed",
            )
        try:
            claims = jwt.get_unverified_claims(raw_token)
            clerk_user_id = str(claims.get("sub", "")).strip() or None
            email_from_token = claims.get("email") or claims.get("email_address")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
            ) from None

    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user identifier in Clerk token",
        )

    from backend.app.db import SessionLocal, User, create_tenant

    with SessionLocal() as session:
        user = session.query(User).filter_by(clerk_user_id=clerk_user_id).first()
        if user is None:
            # Attempt to resolve email
            email = email_from_token
            if not email and CLERK_SECRET_KEY:
                try:
                    clerk_client = Clerk(bearer_auth=CLERK_SECRET_KEY)
                    cu = clerk_client.users.get(user_id=clerk_user_id)
                    if cu and cu.email_addresses:
                        email = cu.email_addresses[0].email_address
                except Exception:
                    pass

            if not email:
                email = f"{clerk_user_id}@clerk.user"

            # Check if an existing account with this email exists
            existing_user = session.query(User).filter_by(email=email).first()
            if existing_user is not None:
                existing_user.clerk_user_id = clerk_user_id
                session.commit()
                session.refresh(existing_user)
                user = existing_user
            else:
                prefix = email.split("@")[0].replace(".", " ").capitalize()
                tenant_name = f"{prefix} Workspace"
                tenant = create_tenant(session, tenant_name)
                user = User(
                    email=email,
                    password_hash="",
                    clerk_user_id=clerk_user_id,
                    role="explorer",
                    tenant_id=tenant.id,
                    company_name=tenant.name,
                    is_admin=True,
                )
                session.add(user)
                session.commit()
                session.refresh(user)

        return UserContext(
            id=user.id,
            email=user.email,
            role=user.role,
            tenant_id=str(user.tenant_id),
            company_name=user.company_name,
            is_admin=bool(user.is_admin),
            clerk_user_id=user.clerk_user_id,
        )


def get_current_user(
    request: Request = None,  # type: ignore[assignment]
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    """Resolve a bearer token into the current user, including their tenant.

    The token's ``tenant_id`` claim must match the user's persisted tenant, so a
    token can never be used to act inside a workspace the user doesn't belong to.
    Supports both legacy custom JWTs (demo accounts) and Clerk Bearer tokens.
    """
    auth_header = authorization
    if not auth_header and request is not None:
        auth_header = request.headers.get("authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    raw_token = auth_header.removeprefix("Bearer ").strip()

    # 1. Try legacy custom JWT first (preserves demo accounts and test suites)
    payload = verify_jwt(raw_token)
    if payload is not None:
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
            return UserContext(
                id=user.id,
                email=user.email,
                role=user.role,
                tenant_id=str(user.tenant_id),
                company_name=user.company_name,
                is_admin=bool(user.is_admin),
            )

    # 2. Fall back to Clerk authentication
    return get_current_user_clerk(request=request, authorization=auth_header)
