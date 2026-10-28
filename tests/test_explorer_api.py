from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


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



