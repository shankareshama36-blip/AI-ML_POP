"""Clerk Webhook endpoints for asynchronous user lifecycle synchronization."""

from __future__ import annotations

import base64
import hashlib
import hmac
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status

from backend.app.config import CLERK_WEBHOOK_SECRET
from backend.app.db import SessionLocal, User, create_tenant

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _verify_webhook_signature(
    secret: str,
    headers: dict[str, str],
    body_bytes: bytes,
) -> bool:
    """Validate Svix webhook signatures sent by Clerk."""
    msg_id = headers.get("svix-id")
    msg_timestamp = headers.get("svix-timestamp")
    msg_signature = headers.get("svix-signature")

    if not msg_id or not msg_timestamp or not msg_signature:
        return False

    clean_secret = secret.removeprefix("whsec_")
    padded_secret = clean_secret + "=" * (-len(clean_secret) % 4)
    try:
        secret_bytes = base64.b64decode(padded_secret)
    except Exception:
        return False

    to_sign = f"{msg_id}.{msg_timestamp}.".encode() + body_bytes
    expected_sig = base64.b64encode(
        hmac.new(secret_bytes, to_sign, hashlib.sha256).digest()
    ).decode("utf-8")

    signatures = [
        sig.split(",", 1)[-1]
        for sig in msg_signature.split(" ")
        if sig
    ]
    return any(hmac.compare_digest(expected_sig, s) for s in signatures)


@router.post("/clerk")
async def handle_clerk_webhook(request: Request) -> dict[str, Any]:
    """Handle incoming Clerk lifecycle webhooks (e.g. user.created)."""
    body_bytes = await request.body()

    if CLERK_WEBHOOK_SECRET:
        headers_dict = {k.lower(): v for k, v in request.headers.items()}
        if not _verify_webhook_signature(CLERK_WEBHOOK_SECRET, headers_dict, body_bytes):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature",
            )

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        ) from None

    event_type = payload.get("type")
    data = payload.get("data", {})

    if event_type == "user.created":
        clerk_user_id = str(data.get("id", "")).strip()
        if not clerk_user_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Missing user ID in event data",
            )

        # Extract primary email or first email address
        email: str | None = None
        email_addresses = data.get("email_addresses") or []
        primary_id = data.get("primary_email_address_id")

        for item in email_addresses:
            if primary_id and item.get("id") == primary_id:
                email = item.get("email_address")
                break
        if not email and email_addresses:
            email = email_addresses[0].get("email_address")
        if not email:
            email = f"{clerk_user_id}@clerk.user"

        email = email.lower().strip()
        role = (
            data.get("public_metadata", {}).get("role")
            or "explorer"
        )

        with SessionLocal() as session:
            # 1. Existing user with this clerk_user_id?
            existing_by_clerk = (
                session.query(User).filter_by(clerk_user_id=clerk_user_id).first()
            )
            if existing_by_clerk:
                return {
                    "status": "already_exists",
                    "user_id": existing_by_clerk.id,
                    "clerk_user_id": clerk_user_id,
                }

            # 2. Existing user with this email? (Account linking)
            existing_by_email = (
                session.query(User).filter_by(email=email).first()
            )
            if existing_by_email:
                existing_by_email.clerk_user_id = clerk_user_id
                session.commit()
                return {
                    "status": "linked",
                    "user_id": existing_by_email.id,
                    "clerk_user_id": clerk_user_id,
                }

            # 3. Fresh user: provision tenant workspace + User record
            prefix = email.split("@")[0].replace(".", " ").capitalize()
            tenant_name = f"{prefix} Workspace"
            tenant = create_tenant(session, tenant_name)

            user = User(
                email=email,
                password_hash="",
                clerk_user_id=clerk_user_id,
                role=role,
                tenant_id=tenant.id,
                company_name=tenant.name,
                is_admin=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            return {
                "status": "created",
                "user_id": user.id,
                "clerk_user_id": clerk_user_id,
                "tenant_id": str(user.tenant_id),
            }

    if event_type == "user.updated":
        clerk_user_id = str(data.get("id", "")).strip()
        if clerk_user_id:
            with SessionLocal() as session:
                user = session.query(User).filter_by(clerk_user_id=clerk_user_id).first()
                if user:
                    new_role = data.get("public_metadata", {}).get("role")
                    if new_role:
                        user.role = new_role
                    session.commit()
                    return {"status": "updated", "user_id": user.id}

        return {"status": "user_not_found"}

    return {"status": "ignored", "event_type": event_type}
