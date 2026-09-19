from fastapi.testclient import TestClient

from backend.app.decision_engine import (
    build_context,
    evaluate_constraints,
    generate_candidate_actions,
    optimize_actions,
    predict_outcomes,
)
from backend.app.formal_engine import MaintenanceRequest
from backend.app.main import app
from backend.app.models import MachineState, OperationalConstraints

client = TestClient(app)

FORMAL_REQUEST = {
    "machine_id": "M-101",
    "maintenance_type": "PREVENTIVE",
    "priority": "HIGH",
    "condition": "WARN",
    "action": "INSPECT",
}
DECISION_PAYLOAD = {
    "maintenance_request": FORMAL_REQUEST,
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


def _create_decision() -> dict[str, object]:
    response = client.post("/decisions/evaluate", json=DECISION_PAYLOAD)

    assert response.status_code == 201
    return response.json()


def test_evaluate_runs_every_stage_and_persists_a_pending_decision() -> None:
    body = _create_decision()

    assert body["formal_validation"]["accepted"] is True
    assert body["context"]["priority"] == "HIGH"
    assert len(body["candidate_actions"]) == 4
    assert len(body["predictions"]) == 4
    assert len(body["constraint_results"]) == 4
    assert body["decision"]["recommended_action_id"] == body["optimization"][
        "best_action_id"
    ]
    assert body["approval"]["status"] == "PENDING"

    fetched = client.get(f"/decisions/{body['decision']['decision_id']}")
    assert fetched.status_code == 200
    assert fetched.json() == body


def test_evaluation_rejects_formally_invalid_request_before_deciding() -> None:
    payload = {
        **DECISION_PAYLOAD,
        "maintenance_request": {**FORMAL_REQUEST, "condition": "FAILING"},
    }

    response = client.post("/decisions/evaluate", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "FORMAL_VALIDATION_FAILED"
    assert response.json()["detail"]["validation"]["failed_at_position"] == "condition"


def test_evaluation_reports_when_hard_constraints_leave_no_action() -> None:
    payload = {
        **DECISION_PAYLOAD,
        "maintenance_request": {**FORMAL_REQUEST, "condition": "CRITICAL"},
        "operational_constraints": {
            **DECISION_PAYLOAD["operational_constraints"],
            "max_budget": 1,
            "technicians_available": False,
            "spare_parts_available": False,
        },
    }

    response = client.post("/decisions/evaluate", json=payload)

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "NO_FEASIBLE_ACTION"


def test_constraints_reject_unsafe_or_unavailable_options() -> None:
    formal = MaintenanceRequest(
        **{**FORMAL_REQUEST, "condition": "CRITICAL", "priority": "CRITICAL"}
    )
    limits = OperationalConstraints(
        max_budget=10_000,
        max_downtime_hours=20,
        deadline_hours=24,
        technicians_available=False,
        spare_parts_available=False,
    )
    context = build_context(
        formal,
        MachineState(
            temperature_c=96,
            vibration_mm_s=9,
            operating_hours=1250,
            status="DEGRADED",
        ),
        limits,
    )
    actions = generate_candidate_actions()
    predictions = predict_outcomes(actions, context)
    constraints = evaluate_constraints(actions, predictions, context)
    violations = {item.action_id: item.violations for item in constraints}

    assert "Technician unavailable for immediate repair" in violations["A"]
    assert "Required spare parts unavailable" in violations["A"]
    assert "Unsafe to continue at the reported condition" in violations["B"]


def test_optimizer_uses_the_lowest_weighted_feasible_dijkstra_path() -> None:
    formal = MaintenanceRequest(**FORMAL_REQUEST)
    limits = OperationalConstraints(
        max_budget=10_000,
        max_downtime_hours=12,
        deadline_hours=16,
        technicians_available=True,
        spare_parts_available=True,
    )
    context = build_context(
        formal,
        MachineState(
            temperature_c=81,
            vibration_mm_s=5.5,
            operating_hours=1250,
            status="DEGRADED",
        ),
        limits,
    )
    actions = generate_candidate_actions()
    predictions = predict_outcomes(actions, context)
    constraints = evaluate_constraints(actions, predictions, context)

    result = optimize_actions(predictions, constraints, limits)

    assert result.best_action_id == min(result.scores, key=result.scores.get)
    assert set(result.scores) == set(result.feasible_actions)


def test_approved_outcome_creates_experience_memory_and_lifecycle_is_guarded() -> None:
    workflow = _create_decision()
    decision = workflow["decision"]
    decision_id = decision["decision_id"]
    outcome = {
        "actual_downtime_hours": 2.5,
        "actual_cost": 1_100,
        "success": True,
        "notes": "Technician completed the work during the planned window.",
    }

    premature = client.post(f"/decisions/{decision_id}/outcome", json=outcome)
    assert premature.status_code == 409

    approved = client.post(
        f"/decisions/{decision_id}/approval",
        json={"status": "APPROVED", "approver_id": "ops-manager-1"},
    )
    assert approved.status_code == 200
    assert approved.json()["approval"]["status"] == "APPROVED"

    second_approval = client.post(
        f"/decisions/{decision_id}/approval",
        json={"status": "REJECTED", "approver_id": "ops-manager-2"},
    )
    assert second_approval.status_code == 409

    completed = client.post(f"/decisions/{decision_id}/outcome", json=outcome)
    assert completed.status_code == 200
    assert completed.json()["outcome"]["success"] is True

    experiences = client.get("/experiences")
    assert experiences.status_code == 200
    experience = next(
        item for item in experiences.json() if item["decision_id"] == decision_id
    )
    assert experience["prediction_accuracy"]["cost_delta"] == round(
        outcome["actual_cost"] - decision["expected_cost"], 2
    )
