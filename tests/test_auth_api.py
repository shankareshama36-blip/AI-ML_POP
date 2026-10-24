from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from backend.app.auth_real import COMMON_PASSWORDS, validate_password
from backend.app.config import (
    ALLOWED_ORIGINS,
    JWT_ALGORITHM,
    JWT_EXPIRE_HOURS,
    JWT_SECRET,
)
from backend.app.db import init_db
from backend.app.main import app

client = TestClient(app)


def test_config_jwt_and_cors() -> None:
    assert JWT_SECRET is not None
    assert JWT_ALGORITHM == "HS256"
    assert JWT_EXPIRE_HOURS == 168
    assert "http://localhost:5173" in ALLOWED_ORIGINS
    assert "*" not in ALLOWED_ORIGINS


def test_password_policy_validation() -> None:
    # Length < 12
    with pytest.raises(ValueError, match="Password must be at least 12 characters"):
        validate_password("Short1!")

    # Length > 128
    with pytest.raises(ValueError, match="Password must be at most 128 characters"):
        validate_password("A" * 129)

    # Common passwords
    assert len(COMMON_PASSWORDS) >= 100
    with pytest.raises(ValueError, match="Password is too common"):
        validate_password("Administrator")

    # Missing uppercase
    with pytest.raises(ValueError, match="Password must contain an uppercase letter"):
        validate_password("lowercase1234!")

    # Missing lowercase
    with pytest.raises(ValueError, match="Password must contain a lowercase letter"):
        validate_password("UPPERCASE1234!")

    # Missing digit
    with pytest.raises(ValueError, match="Password must contain a digit"):
        validate_password("NoDigitsHere!!")

    # Missing symbol
    with pytest.raises(ValueError, match="Password must contain a symbol"):
        validate_password("NoSymbolsHere123")

    # Valid password
    validate_password("ValidPassword123!")


def test_signup_and_password_reset_flow() -> None:
    init_db()
    email = f"operator-{uuid4().hex}@example.com"
    original_password = "StrongPassword1!"
    new_password = "ChangedPassword2!"

    signup = client.post(
        "/auth/signup",
        json={"email": email, "password": original_password, "role": "technician"},
    )
    assert signup.status_code == 201

    forgot = client.post("/auth/forgot-password", json={"email": email})
    assert forgot.status_code == 200
    token = forgot.json()["reset_token"]
    assert token

    reset = client.post("/auth/reset-password", json={"token": token, "password": new_password})
    assert reset.status_code == 204

    old_login = client.post("/auth/login", json={"email": email, "password": original_password})
    assert old_login.status_code == 401
    assert old_login.json() == {"detail": "Invalid email or password"}

    new_login = client.post("/auth/login", json={"email": email, "password": new_password})
    assert new_login.status_code == 200


def test_signup_input_validation() -> None:
    # Extra field forbidden
    res_extra = client.post(
        "/auth/signup",
        json={
            "email": f"extra-{uuid4().hex}@example.com",
            "password": "ValidPassword123!",
            "role": "technician",
            "extra_field": "hacked",
        },
    )
    assert res_extra.status_code == 422

    # Invalid role
    res_role = client.post(
        "/auth/signup",
        json={
            "email": f"role-{uuid4().hex}@example.com",
            "password": "ValidPassword123!",
            "role": "superadmin",
        },
    )
    assert res_role.status_code == 422

    # Weak password
    res_weak = client.post(
        "/auth/signup",
        json={
            "email": f"weak-{uuid4().hex}@example.com",
            "password": "weak",
            "role": "technician",
        },
    )
    assert res_weak.status_code == 422


def test_generic_auth_errors() -> None:
    # Non-existent user
    res1 = client.post(
        "/auth/login",
        json={"email": "nonexistent@example.com", "password": "RandomPassword123!"},
    )
    assert res1.status_code == 401
    assert res1.json() == {"detail": "Invalid email or password"}


def test_security_headers_hsts() -> None:
    # Non-HTTPS request: no HSTS
    res_http = client.get("/health")
    assert "Strict-Transport-Security" not in res_http.headers

    # HTTPS forwarded proto: HSTS present
    res_https = client.get("/health", headers={"x-forwarded-proto": "https"})
    assert res_https.headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains"


def test_cors_headers() -> None:
    res = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert res.headers.get("access-control-allow-credentials") == "true"


def test_decisions_count_endpoint() -> None:
    res = client.get("/analytics/decisions-count")
    assert res.status_code == 200
    assert "count" in res.json()
    assert isinstance(res.json()["count"], int)


def test_rate_limiting_login() -> None:
    # 5 attempts allowed in 15 minutes, 6th must return 429
    responses = [
        client.post(
            "/auth/login",
            json={"email": f"ratelimit-{i}@example.com", "password": "WrongPassword123!"},
        )
        for i in range(6)
    ]
    assert responses[-1].status_code == 429
    assert responses[-1].json() == {"detail": "Too many attempts. Try again later."}


def test_demo_account_logins_and_rate_limit_bypass() -> None:
    init_db()
    # 1. Standard demo accounts work
    for email, pwd, expected_role in [
        ("tech@praxis.local", "Tech@12345!", "technician"),
        ("maint@praxis.local", "Maint@12345!", "maintenance_supervisor"),
        ("prod@praxis.local", "Prod@12345!", "production_supervisor"),
        ("plant@praxis.local", "Plant@12345!", "plant_manager"),
    ]:
        res = client.post("/auth/login", json={"email": email, "password": pwd})
        assert res.status_code == 200, f"Login failed for {email}: {res.text}"
        assert res.json()["user"]["role"] == expected_role

    # 2. Legacy usernames and legacy passwords work
    legacy_logins = [
        ("tech-1", "tech123", "technician"),
        ("tech-1", "Tech@12345!", "technician"),
        ("tech@ampop.local", "Tech@12345", "technician"),
        ("maint-sup", "maint123", "maintenance_supervisor"),
        ("prod-sup", "prod123", "production_supervisor"),
        ("plant-mgr", "plant123", "plant_manager"),
    ]
    for username, pwd, expected_role in legacy_logins:
        res = client.post("/auth/login", json={"email": username, "password": pwd})
        assert res.status_code == 200, f"Legacy login failed for {username}: {res.text}"
        assert res.json()["user"]["role"] == expected_role

    # 3. Repeated demo logins are never blocked by rate limit
    for i in range(12):
        res = client.post(
            "/auth/login?demo=true",
            headers={"X-Demo-Login": "true"},
            json={"email": "tech@praxis.local", "password": "Tech@12345!"},
        )
        assert res.status_code == 200, f"Demo login attempt {i} got throttled: {res.text}"


def test_forgot_password_with_demo_alias() -> None:
    init_db()
    res = client.post("/auth/forgot-password", json={"email": "tech-1"})
    assert res.status_code == 200
    data = res.json()
    assert "reset_token" in data
    assert data["reset_token"] is not None

