"""Tenant settings: approval thresholds and workspace administration."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.app.auth_real import get_current_user
from backend.app.core.rate_limit import limiter
from backend.app.tenancy import (
    get_thresholds,
    get_workspace,
    rotate_invite_code,
    set_auto_approve,
    update_thresholds,
)

router = APIRouter(prefix="/settings", tags=["settings"])
CurrentUser = Annotated[dict[str, object], Depends(get_current_user)]

_MAX_THRESHOLD = 1_000_000_000.0


def _require_settings_admin(current_user: dict[str, object]) -> None:
    """Only the workspace admin, Plant Manager, or Business Owner may change tenant settings."""
    if not (current_user.get("is_admin") or current_user.get("role") in ("plant_manager", "business_owner")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace admins, Plant Managers, or Business Owners can manage settings.",
        )


class ThresholdsResponse(BaseModel):
    tier1_max: float
    tier2_max: float
    auto_approve_enabled: bool = False


class ThresholdsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tier1_max: float = Field(gt=0, le=_MAX_THRESHOLD)
    tier2_max: float = Field(gt=0, le=_MAX_THRESHOLD)
    auto_approve_enabled: bool | None = None

    @model_validator(mode="after")
    def _ordered(self) -> ThresholdsUpdate:
        if self.tier2_max <= self.tier1_max:
            raise ValueError("Tier 2 max must be greater than Tier 1 max")
        return self


class AutoApproveUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    enabled: bool


class MemberResponse(BaseModel):
    email: str
    role: str
    is_admin: bool


class WorkspaceResponse(BaseModel):
    tenant_id: str
    company_name: str
    invite_code: str
    members: list[MemberResponse]


def _workspace_response(tenant_id: str, rotate: bool = False) -> WorkspaceResponse:
    try:
        workspace = rotate_invite_code(tenant_id) if rotate else get_workspace(tenant_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return WorkspaceResponse(
        tenant_id=workspace.tenant_id,
        company_name=workspace.company_name,
        invite_code=workspace.invite_code,
        members=[MemberResponse(email=m.email, role=m.role, is_admin=m.is_admin) for m in workspace.members],
    )


@router.get("/thresholds", response_model=ThresholdsResponse)
def read_thresholds(current_user: CurrentUser) -> ThresholdsResponse:
    """Any member may read their own workspace's thresholds."""
    thresholds = get_thresholds(str(current_user["tenant_id"]))
    return ThresholdsResponse(**thresholds.as_dict())


@router.put("/thresholds", response_model=ThresholdsResponse)
@limiter.limit("30/minute")
def write_thresholds(
    request: Request, payload: ThresholdsUpdate, current_user: CurrentUser
) -> ThresholdsResponse:
    _require_settings_admin(current_user)
    thresholds = update_thresholds(
        str(current_user["tenant_id"]),
        payload.tier1_max,
        payload.tier2_max,
        updated_by=str(current_user["email"]),
        auto_approve_enabled=payload.auto_approve_enabled,
    )
    return ThresholdsResponse(**thresholds.as_dict())


@router.put("/auto-approve", response_model=ThresholdsResponse)
@limiter.limit("30/minute")
def toggle_auto_approve(
    request: Request, payload: AutoApproveUpdate, current_user: CurrentUser
) -> ThresholdsResponse:
    _require_settings_admin(current_user)
    set_auto_approve(str(current_user["tenant_id"]), payload.enabled)
    thresholds = get_thresholds(str(current_user["tenant_id"]))
    return ThresholdsResponse(**thresholds.as_dict())


@router.get("/workspace", response_model=WorkspaceResponse)
def read_workspace(current_user: CurrentUser) -> WorkspaceResponse:
    _require_settings_admin(current_user)
    return _workspace_response(str(current_user["tenant_id"]))


@router.post("/workspace/invite-code", response_model=WorkspaceResponse)
@limiter.limit("10/minute")
def regenerate_invite_code(request: Request, current_user: CurrentUser) -> WorkspaceResponse:
    """Rotate the invite code; the previous code stops working immediately."""
    _require_settings_admin(current_user)
    return _workspace_response(str(current_user["tenant_id"]), rotate=True)
