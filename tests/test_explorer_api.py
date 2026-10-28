from uuid import UUID

from fastapi.testclient import TestClient

from backend.app.auth_real import create_jwt, hash_password
from backend.app.db import SessionLocal, User, init_db
from backend.app.main import app

init_db()
with SessionLocal() as session:
    user = session.query(User).filter_by(email="explorer-test@praxis.local").first()
    if user is None:
        user = User(
            email="explorer-test@praxis.local",
            password_hash=hash_password("StrongTestPassword1"),
            role="explorer",
            tenant_id=UUID("00000000-0000-0000-0000-000000000000"),
            company_name="Test Company",
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    token = create_jwt(user.id, user.role, user.tenant_id)

client = TestClient(app, headers={"Authorization": f"Bearer {token}"})
unauth_client = TestClient(app)


def test_explorer_unauthenticated_returns_401() -> None:
    res1 = unauth_client.post("/explorer/analyze", json={"title": "T", "options": ["A", "B"], "constraints": "C"})
    assert res1.status_code == 401

    res2 = unauth_client.post("/explorer/chat", json={"messages": [{"role": "user", "content": "hi"}]})
    assert res2.status_code == 401


def test_explorer_analyze_mock_fallback() -> None:
    payload = {
        "title": "Which cloud provider to choose?",
        "options": ["AWS", "GCP", "Azure"],
        "constraints": "Budget: $5,000/mo, Multi-region required, High Kubernetes support",
    }
    response = client.post("/explorer/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "analysis" in data
    assert "text" in data
    assert "model_used" in data
    assert len(data["analysis"]) > 50
    # Must provide exactly 3 reasons
    assert "1." in data["analysis"]
    assert "2." in data["analysis"]
    assert "3." in data["analysis"]
    assert "Praxis" in data["analysis"]
    assert "Gemini" not in data["analysis"]
    assert "Google" not in data["analysis"]


def test_explorer_analyze_validation() -> None:
    # Requires at least 2 options
    bad_payload = {
        "title": "Solo option",
        "options": ["JustOne"],
        "constraints": "No budget",
    }
    response = client.post("/explorer/analyze", json=bad_payload)
    assert response.status_code == 422


def test_explorer_chat() -> None:
    payload = {
        "messages": [
            {"role": "user", "content": "Can you explain why Option A is better?"}
        ],
        "decision_context": "Comparing AWS vs GCP with $5k budget",
    }
    response = client.post("/explorer/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["model_used"] == "praxis-ai-engine"


def test_explorer_chat_greeting() -> None:
    payload = {
        "messages": [
            {"role": "user", "content": "hello"}
        ],
        "decision_context": "Comparing AWS vs GCP with $5k budget",
    }
    response = client.post("/explorer/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    # Greetings should be warm, not echoing decision title
    assert "hello" in data["reply"].lower()
    assert "comparing aws" not in data["reply"].lower()
    assert "for decision" not in data["reply"].lower()
    assert "praxis ai engine response:" not in data["reply"].lower()


def test_explorer_chat_specific_followup_why_not() -> None:
    payload = {
        "messages": [
            {"role": "assistant", "content": "Hello! I am Praxis, your AI decision assistant."},
            {"role": "user", "content": "What is the best laptop?"},
            {"role": "assistant", "content": "MacBook Air M3 is mathematically recommended."},
            {"role": "user", "content": "why not MacBook Pro M5?"},
        ],
        "title": "Which laptop to buy?",
        "options": ["MacBook Air M3", "MacBook Pro M5", "Dell XPS 15"],
        "constraints": "Budget: 1.2 Lakh INR",
        "recommended_option": "MacBook Air M3",
    }
    response = client.post("/explorer/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    # Must specifically mention the questioned option and not give a generic non-answer
    assert "MacBook Pro M5" in data["reply"]
    assert "Budget: 1.2 Lakh INR" in data["reply"] or "constraints" in data["reply"].lower()


def test_explorer_chat_suggested_prompts() -> None:
    app.state.limiter.reset()
    prompts = [
        ("Why was this chosen?", "MacBook Air M3"),
        ("Compare top 2 options", "Comparing"),
        ("What if budget was higher?", "budget"),
    ]
    for prompt, expected_keyword in prompts:
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "title": "Which laptop to buy?",
            "options": ["MacBook Air M3", "Dell XPS 15"],
            "constraints": "Budget: 1.2 Lakh INR",
            "recommended_option": "MacBook Air M3",
        }
        response = client.post("/explorer/chat", json=payload)
        assert response.status_code == 200
        reply = response.json()["reply"]
        assert expected_keyword.lower() in reply.lower()



