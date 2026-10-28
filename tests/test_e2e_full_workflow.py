"""End-to-End (E2E) integration test suite for the full Praxis workflow."""

from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def _demo_login(email: str, password: str) -> str:
    """Authenticate a demo user and return the Bearer JWT token."""
    res = client.post(
        "/auth/login?demo=true",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == email
    return str(data["token"])


def test_full_e2e_complaint_and_ai_workflow() -> None:
    """Simulate the complete user journey across Technician, Supervisors, and AI Explorer."""
    if hasattr(app.state, "limiter"):
        app.state.limiter.reset()

    # 1. Login as a Technician
    tech_token = _demo_login("tech@praxis.local", "Tech@12345!")
    tech_headers = {"Authorization": f"Bearer {tech_token}"}

    # 2. Submit a new complaint (POST /complaints)
    create_res = client.post(
        "/complaints",
        json={
            "machine_id": "M-E2E-101",
            "problem_type": "VIBRATION",
            "severity": "MEDIUM",
            "notes": "E2E automated test: abnormal spindle vibration detected on Line 1.",
        },
        headers=tech_headers,
    )
    assert create_res.status_code == 201, create_res.text
    created_complaint = create_res.json()
    complaint_id = created_complaint["complaint_id"]
    assert created_complaint["machine_id"] == "M-E2E-101"
    assert created_complaint["status"] == "PENDING_MAINT"

    # 3. Login as a Maintenance Supervisor
    maint_token = _demo_login("maint@praxis.local", "Maint@12345!")
    maint_headers = {"Authorization": f"Bearer {maint_token}"}

    # 4. Fetch the pending queue (GET /complaints) and verify the complaint is there
    queue_res = client.get("/complaints", headers=maint_headers)
    assert queue_res.status_code == 200, queue_res.text
    queue_ids = [c["complaint_id"] for c in queue_res.json()]
    assert complaint_id in queue_ids

    # 5. Evaluate the complaint with AI (POST /complaints/{id}/evaluate)
    eval_res = client.post(
        f"/complaints/{complaint_id}/evaluate",
        headers=maint_headers,
    )
    assert eval_res.status_code == 200, eval_res.text
    evaluated = eval_res.json()
    assert evaluated["decision"] is not None
    assert "recommended_action_id" in evaluated["decision"]
    assert evaluated["decision"]["expected_cost"] > 0

    # Verify Technician is blocked from approving (403 Forbidden)
    tech_approve_res = client.post(
        f"/complaints/{complaint_id}/approve",
        json={"comment": "Technician trying to approve"},
        headers=tech_headers,
    )
    assert tech_approve_res.status_code == 403

    # 6. Approve the complaint as Maintenance Supervisor (POST /complaints/{id}/approve)
    approve_res = client.post(
        f"/complaints/{complaint_id}/approve",
        json={"comment": "Maintenance supervisor verified and approved."},
        headers=maint_headers,
    )
    assert approve_res.status_code == 200, approve_res.text
    after_maint = approve_res.json()

    # 7. Verify the status transitions to PENDING_PROD or APPROVED
    assert after_maint["status"] in ("PENDING_PROD", "APPROVED")

    # If multi-tier escalated to PENDING_PROD, complete Tier-2 approval as Production Supervisor
    if after_maint["status"] == "PENDING_PROD":
        prod_token = _demo_login("prod@praxis.local", "Prod@12345!")
        prod_headers = {"Authorization": f"Bearer {prod_token}"}
        prod_approve_res = client.post(
            f"/complaints/{complaint_id}/approve",
            json={"comment": "Production supervisor approved downtime window."},
            headers=prod_headers,
        )
        assert prod_approve_res.status_code == 200, prod_approve_res.text
        assert prod_approve_res.json()["status"] in ("PENDING_PLANT", "APPROVED")

    # 8. Test the Explorer endpoint (POST /explorer/chat) with a simple "Hi"
    chat_res = client.post(
        "/explorer/chat",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers=tech_headers,
    )
    assert chat_res.status_code == 200, chat_res.text
    chat_data = chat_res.json()
    assert "reply" in chat_data
    assert len(chat_data["reply"].strip()) > 0

    # 9. Test Explorer analyze fallback (POST /explorer/analyze)
    analyze_res = client.post(
        "/explorer/analyze",
        json={
            "title": "Select backup cooling pump vendor",
            "options": ["Vendor Alpha ($12k, 2d lead)", "Vendor Beta ($9k, 7d lead)"],
            "constraints": "Budget under $15k, maximum downtime 72 hours",
        },
        headers=tech_headers,
    )
    assert analyze_res.status_code == 200, analyze_res.text
    analyze_data = analyze_res.json()
    assert "analysis" in analyze_data
    assert "recommended_option" in analyze_data


def test_e2e_weak_password_rejected_cleanly() -> None:
    """Verify weak passwords return a clean validation error and never crash."""
    if hasattr(app.state, "limiter"):
        app.state.limiter.reset()

    res = client.post(
        "/auth/signup",
        json={
            "email": "weakuser@example.com",
            "password": "short",
            "role": "explorer",
            "company_name": "WeakPass Test Co",
        },
    )
    assert res.status_code == 422
