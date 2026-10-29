import uuid
from datetime import UTC
from uuid import UUID

from fastapi.testclient import TestClient

from backend.app.auth_real import create_jwt, hash_password
from backend.app.db import SessionLocal, Tenant, User, init_db
from backend.app.main import app

client = TestClient(app)

DECISION_PAYLOAD = {
    "maintenance_request": {
        "machine_id": "M-101",
        "maintenance_type": "PREVENTIVE",
        "priority": "HIGH",
        "condition": "WARN",
        "action": "INSPECT",
    },
    "machine_state": {
        "temperature_c": 81,
        "vibration_mm_s": 5.5,
        "operating_hours": 1250,
        "status": "DEGRADED",
    },
    "operational_constraints": {
        "max_budget": 10_000,
        "max_downtime_hours": 12,
        "deadline_hours": 16,
        "technicians_available": True,
        "spare_parts_available": True,
    },
}


def _setup_security_fixtures():
    init_db()
    tenant_a = UUID("11111111-1111-1111-1111-111111111111")
    tenant_b = UUID("22222222-2222-2222-2222-222222222222")

    with SessionLocal() as session:
        t_a = session.get(Tenant, tenant_a)
        if not t_a:
            session.add(Tenant(id=tenant_a, name="Company A", invite_code="inv-a-12345678"))
        t_b = session.get(Tenant, tenant_b)
        if not t_b:
            session.add(Tenant(id=tenant_b, name="Company B", invite_code="inv-b-12345678"))
        session.commit()

        # Users in Tenant A
        def _get_or_create_user(email: str, role: str, tenant_id: UUID) -> User:
            u = session.query(User).filter_by(email=email).first()
            if not u:
                u = User(
                    email=email,
                    password_hash=hash_password("StrongSecurityPassword1!"),
                    role=role,
                    tenant_id=tenant_id,
                    company_name=f"Company {tenant_id.hex[:1]}",
                )
                session.add(u)
                session.commit()
                session.refresh(u)
            return u

        tech_a = _get_or_create_user("tech-sec-a@example.com", "technician", tenant_a)
        maint_a = _get_or_create_user("maint-sec-a@example.com", "maintenance_supervisor", tenant_a)
        tech_b = _get_or_create_user("tech-sec-b@example.com", "technician", tenant_b)

        token_tech_a = create_jwt(tech_a.id, tech_a.role, tech_a.tenant_id)
        token_maint_a = create_jwt(maint_a.id, maint_a.role, maint_a.tenant_id)
        token_tech_b = create_jwt(tech_b.id, tech_b.role, tech_b.tenant_id)

    return {
        "unauth": TestClient(app),
        "tech_a": TestClient(app, headers={"Authorization": f"Bearer {token_tech_a}"}),
        "maint_a": TestClient(app, headers={"Authorization": f"Bearer {token_maint_a}"}),
        "tech_b": TestClient(app, headers={"Authorization": f"Bearer {token_tech_b}"}),
    }


def test_unauthenticated_requests_return_401():
    clients = _setup_security_fixtures()
    unauth = clients["unauth"]
    random_uuid = uuid.uuid4()

    assert unauth.post("/decisions/evaluate", json=DECISION_PAYLOAD).status_code == 401
    assert unauth.get(f"/decisions/{random_uuid}").status_code == 401
    assert unauth.post(f"/decisions/{random_uuid}/approval", json={"status": "APPROVED", "approver_id": "x"}).status_code == 401
    assert unauth.post(f"/decisions/{random_uuid}/outcome", json={"actual_downtime_hours": 1, "actual_cost": 100, "success": True}).status_code == 401
    assert unauth.get("/experiences").status_code == 401
    assert unauth.post("/complaints", json={"machine_id": "M-101", "problem_type": "Leak", "severity": "LOW"}).status_code == 401
    assert unauth.get("/complaints").status_code == 401
    assert unauth.post(f"/complaints/{random_uuid}/approve", json={}).status_code == 401
    assert unauth.get("/settings/thresholds").status_code == 401


def test_technician_cannot_approve_decisions_or_complaints_403():
    clients = _setup_security_fixtures()
    tech_a = clients["tech_a"]

    # 1. Tech creates a decision
    dec_res = tech_a.post("/decisions/evaluate", json=DECISION_PAYLOAD)
    assert dec_res.status_code == 201
    dec_id = dec_res.json()["decision"]["decision_id"]

    # 2. Technician tries to approve -> 403 Forbidden
    tech_appr = tech_a.post(f"/decisions/{dec_id}/approval", json={"status": "APPROVED", "approver_id": "tech-sec-a"})
    assert tech_appr.status_code == 403
    assert "not authorised" in tech_appr.json()["detail"].lower()

    # 3. Technician tries to record outcome -> 403 Forbidden
    tech_outcome = tech_a.post(f"/decisions/{dec_id}/outcome", json={"actual_downtime_hours": 1, "actual_cost": 100, "success": True})
    assert tech_outcome.status_code == 403

    # 4. Tech creates a complaint
    comp_res = tech_a.post("/complaints", json={"machine_id": "M-101", "problem_type": "Leak", "severity": "LOW"})
    assert comp_res.status_code == 201
    comp_id = comp_res.json()["complaint_id"]

    # 5. Technician tries to approve complaint -> 403 Forbidden
    tech_comp_appr = tech_a.post(f"/complaints/{comp_id}/approve", json={"comment": "self"})
    assert tech_comp_appr.status_code == 403


def test_supervisor_approval_returns_200():
    clients = _setup_security_fixtures()
    tech_a = clients["tech_a"]
    maint_a = clients["maint_a"]

    # 1. Tech creates a decision
    dec_res = tech_a.post("/decisions/evaluate", json=DECISION_PAYLOAD)
    assert dec_res.status_code == 201
    dec_id = dec_res.json()["decision"]["decision_id"]

    # 2. Maintenance Supervisor approves -> 200 OK
    appr_res = maint_a.post(f"/decisions/{dec_id}/approval", json={"status": "APPROVED", "approver_id": "maint-sec-a"})
    assert appr_res.status_code == 200
    assert appr_res.json()["approval"]["status"] == "APPROVED"

    # 3. Supervisor records outcome -> 200 OK
    outcome_res = maint_a.post(
        f"/decisions/{dec_id}/outcome",
        json={"actual_downtime_hours": 1.5, "actual_cost": 800, "success": True, "notes": "Done"},
    )
    assert outcome_res.status_code == 200
    assert outcome_res.json()["outcome"]["success"] is True


def test_tenant_isolation_returns_404_not_403():
    clients = _setup_security_fixtures()
    tech_a = clients["tech_a"]
    tech_b = clients["tech_b"]

    # Decision in Tenant A
    dec_res = tech_a.post("/decisions/evaluate", json=DECISION_PAYLOAD)
    assert dec_res.status_code == 201
    dec_id = dec_res.json()["decision"]["decision_id"]

    # Complaint in Tenant A
    comp_res = tech_a.post("/complaints", json={"machine_id": "M-101", "problem_type": "Leak", "severity": "LOW"})
    assert comp_res.status_code == 201
    comp_id = comp_res.json()["complaint_id"]

    # User in Tenant B attempts to access Tenant A decision -> 404 (existence not leaked)
    res_dec_b = tech_b.get(f"/decisions/{dec_id}")
    assert res_dec_b.status_code == 404
    assert "not found" in res_dec_b.json()["detail"].lower()

    # User in Tenant B attempts to access Tenant A complaint -> 404
    res_comp_b = tech_b.get(f"/complaints/{comp_id}")
    assert res_comp_b.status_code == 404
    assert "not found" in res_comp_b.json()["detail"].lower()


def test_social_login_returns_410_gone():
    res = client.post("/auth/social-login", json={"provider": "google", "email": "test@example.com"})
    assert res.status_code == 410
    assert "deprecated" in res.json()["detail"].lower()


def test_production_mode_rejects_unverified_clerk_token(monkeypatch):
    import backend.app.auth_real as auth_real

    monkeypatch.setattr(auth_real, "ENV", "production")
    monkeypatch.setattr(auth_real, "CLERK_SECRET_KEY", "")

    # Request with arbitrary unverified token in production must fail with 500/401, not 200
    res = client.post("/auth/verify", headers={"Authorization": "Bearer fake.unverified.token"})
    assert res.status_code in (401, 500)


def test_submitter_self_approval_blocked():
    import pytest

    from backend.app.complaints import approve_complaint

    clients = _setup_security_fixtures()
    tech_a = clients["tech_a"]

    # 1. Endpoint level: Maintenance supervisor cannot even submit complaint (403 role separation)
    maint_a = clients["maint_a"]
    comp_403 = maint_a.post("/complaints", json={"machine_id": "M-102", "problem_type": "Overheat", "severity": "HIGH"})
    assert comp_403.status_code == 403

    # 2. Technician submits complaint
    comp_res = tech_a.post("/complaints", json={"machine_id": "M-102", "problem_type": "Overheat", "severity": "HIGH"})
    assert comp_res.status_code == 201
    comp_id = comp_res.json()["complaint_id"]

    # 3. Technician cannot approve their own complaint via API (403 role restriction)
    tech_appr = tech_a.post(f"/complaints/{comp_id}/approve", json={"comment": "Self approval"})
    assert tech_appr.status_code == 403

    # 4. Complaints engine internal safeguard: even if called directly with supervisor role, submitter identity is blocked
    with pytest.raises(ValueError, match="Submitter cannot approve"):
        approve_complaint(
            complaint_id=uuid.UUID(comp_id),
            username="tech-sec-a@example.com",
            role="maintenance_supervisor",
            tenant_id="11111111-1111-1111-1111-111111111111",
        )


def test_decision_self_approval_blocked():
    clients = _setup_security_fixtures()
    maint_a = clients["maint_a"]

    # Maint supervisor creates a decision
    dec_res = maint_a.post("/decisions/evaluate", json=DECISION_PAYLOAD)
    assert dec_res.status_code == 201
    dec_id = dec_res.json()["decision"]["decision_id"]

    # Maint supervisor tries to self-approve it
    appr_res = maint_a.post(f"/decisions/{dec_id}/approval", json={"status": "APPROVED", "approver_id": "maint-sec-a"})
    assert appr_res.status_code == 409
    assert "submitter cannot approve" in appr_res.json()["detail"].lower()


def test_clerk_auto_provisioning_uses_default_tenant():
    from datetime import datetime, timedelta

    from jose import jwt

    from backend.app.config import DEFAULT_TENANT_ID, DEFAULT_WORKSPACE_NAME

    init_db()
    unique_sub = f"clerk_sub_{uuid.uuid4().hex[:8]}"
    email = f"user_{uuid.uuid4().hex[:6]}@example.com"
    exp = datetime.now(UTC) + timedelta(hours=1)
    fake_token = jwt.encode({"sub": unique_sub, "email": email, "exp": exp}, "secret", algorithm="HS256")

    res = client.post("/auth/verify", headers={"Authorization": f"Bearer {fake_token}"})
    assert res.status_code == 200
    user_data = res.json()["user"]
    assert user_data["tenant_id"] == DEFAULT_TENANT_ID
    assert user_data["role"] == "explorer"
    assert user_data["company_name"] == DEFAULT_WORKSPACE_NAME

