import uuid
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from jose import jwt

from backend.app.db import SessionLocal, Tenant, User, init_db
from backend.app.main import app

client = TestClient(app)


def test_clerk_webhook_user_created() -> None:
    init_db()
    unique_id = f"user_test_{uuid.uuid4().hex[:8]}"
    email = f"clerk_{uuid.uuid4().hex[:6]}@example.com"

    payload = {
        "type": "user.created",
        "data": {
            "id": unique_id,
            "email_addresses": [{"id": "idn_1", "email_address": email}],
            "primary_email_address_id": "idn_1",
            "public_metadata": {"role": "business_owner"},
        },
    }

    res = client.post("/webhooks/clerk", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "created"
    assert data["clerk_user_id"] == unique_id

    # Verify user and tenant in DB
    with SessionLocal() as session:
        user = session.query(User).filter_by(clerk_user_id=unique_id).first()
        assert user is not None
        assert user.email == email
        assert user.role == "business_owner"
        tenant = session.get(Tenant, user.tenant_id)
        assert tenant is not None

    # Duplicate webhook should return already_exists
    res2 = client.post("/webhooks/clerk", json=payload)
    assert res2.status_code == 200
    assert res2.json()["status"] == "already_exists"


def test_clerk_get_current_user_and_protected_endpoint() -> None:
    init_db()
    unique_id = f"user_clerk_{uuid.uuid4().hex[:8]}"
    email = f"clerk_jwt_{uuid.uuid4().hex[:6]}@example.com"

    # Pre-create user via webhook
    client.post(
        "/webhooks/clerk",
        json={
            "type": "user.created",
            "data": {
                "id": unique_id,
                "email_addresses": [{"id": "idn_1", "email_address": email}],
                "primary_email_address_id": "idn_1",
                "public_metadata": {"role": "technician"},
            },
        },
    )

    # Generate a token with sub=unique_id
    expires = datetime.now(UTC) + timedelta(hours=1)
    fake_clerk_token = jwt.encode(
        {"sub": unique_id, "email": email, "exp": expires},
        "some-key-or-secret",
        algorithm="HS256",
    )

    # Call /auth/verify using the Clerk token
    res = client.post(
        "/auth/verify",
        headers={"Authorization": f"Bearer {fake_clerk_token}"},
    )
    assert res.status_code == 200
    user_data = res.json()["user"]
    assert user_data["email"] == email
    assert user_data["clerk_user_id"] == unique_id
