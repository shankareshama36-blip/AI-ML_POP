"""Email/password authentication endpoints for AM&POP."""

from __future__ import annotations

from email.utils import parseaddr
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError

from backend.app.auth_real import (
    create_jwt,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.app.db import SessionLocal, User

router = APIRouter(prefix="/auth", tags=["auth"])
CurrentUser = Annotated[dict[str, object], Depends(get_current_user)]
ALLOWED_ROLES = {"technician", "maintenance_supervisor", "production_supervisor", "plant_manager"}


class SignupRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    role: str
    invite_code: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


def _valid_email(email: str) -> bool:
    _, parsed = parseaddr(email)
    return parsed == email and "@" in email and "." in email.rsplit("@", 1)[-1]


def _auth_response(user: User) -> AuthResponse:
    return AuthResponse(token=create_jwt(user.id, user.role), user=UserResponse(id=user.id, email=user.email, role=user.role))


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest) -> AuthResponse:
    email = payload.email.strip().lower()
    if not _valid_email(email):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid email")
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid role")
    with SessionLocal() as session:
        user = User(email=email, password_hash=hash_password(payload.password), role=payload.role)
        session.add(user)
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered") from exc
        session.refresh(user)
        return _auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    with SessionLocal() as session:
        user = session.query(User).filter_by(email=payload.email.strip().lower()).first()
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        return _auth_response(user)


@router.post("/verify", response_model=dict[str, UserResponse])
def verify(current_user: CurrentUser) -> dict[str, UserResponse]:
    return {"user": UserResponse(**current_user)}
