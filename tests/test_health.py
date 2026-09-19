import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

VALID_REQUEST = {
    "machine_id": "M-101",
    "maintenance_type": "PREVENTIVE",
    "priority": "HIGH",
    "condition": "WARN",
    "action": "INSPECT",
}


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "am-pop-api",
    }


def test_validate_maintenance_request_endpoint_accepts_valid_request() -> None:
    response = client.post("/validate/maintenance-request", json=VALID_REQUEST)

    assert response.status_code == 200
    assert response.json()["accepted"] is True
    assert response.json()["final_state"] == "ACCEPT"
    assert response.json()["trace"][-1] == "ACCEPT"


def test_validate_maintenance_request_endpoint_rejects_invalid_request() -> None:
    response = client.post(
        "/validate/maintenance-request",
        json={**VALID_REQUEST, "priority": "URGENT"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "accepted": False,
        "final_state": "REJECT",
        "reason": "Invalid priority",
        "failed_at_position": "priority",
        "trace": ["START", "MACHINE_VALID", "TYPE_VALID", "REJECT"],
    }


@pytest.mark.parametrize(
    "invalid_payload",
    [
        {key: value for key, value in VALID_REQUEST.items() if key != "machine_id"},
        {
            key: value
            for key, value in VALID_REQUEST.items()
            if key != "maintenance_type"
        },
        {key: value for key, value in VALID_REQUEST.items() if key != "priority"},
        {key: value for key, value in VALID_REQUEST.items() if key != "condition"},
        {key: value for key, value in VALID_REQUEST.items() if key != "action"},
        {**VALID_REQUEST, "priority": 1},
        {**VALID_REQUEST, "unexpected_field": "not allowed"},
    ],
)
def test_validate_maintenance_request_endpoint_rejects_invalid_shapes(
    invalid_payload: dict[str, object],
) -> None:
    response = client.post("/validate/maintenance-request", json=invalid_payload)

    assert response.status_code == 422
