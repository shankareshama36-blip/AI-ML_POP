from uuid import uuid4

from fastapi.testclient import TestClient

from backend.app.db import init_db
from backend.app.main import app

client = TestClient(app)


def test_decision_approval_without_token_returns_401() -> None:
    """Call POST /decisions/{id}/approval without a token -> Expect 401."""
    decision_id = uuid4()
    response = client.post(
        f"/decisions/{decision_id}/approval",
        json={"status": "APPROVED", "approver_id": "unauthenticated-user"},
    )
    assert response.status_code == 401


def test_decision_approval_as_technician_returns_403() -> None:
    """Call POST /decisions/{id}/approval as a technician -> Expect 403."""
    init_db()
    login_res = client.post(
        "/auth/login",
        json={"email": "tech@praxis.local", "password": "Tech@12345!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    decision_id = uuid4()
    response = client.post(
        f"/decisions/{decision_id}/approval",
        headers=headers,
        json={"status": "APPROVED", "approver_id": "tech@praxis.local"},
    )
    assert response.status_code == 403
