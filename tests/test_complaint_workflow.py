from backend.app.complaints import (
    ComplaintCreate,
    approve_complaint,
    attach_decision,
    clear_complaints,
    create_complaint,
)
from backend.app.db import init_db


def test_approval_chain_transitions_for_all_cost_thresholds() -> None:
    """Each cost tier advances only to the next required approver."""
    scenarios = (
        (9_999, ["maintenance_supervisor"], ["APPROVED"]),
        (10_000, ["maintenance_supervisor", "production_supervisor"], ["PENDING_PROD", "APPROVED"]),
        (50_000, ["maintenance_supervisor", "production_supervisor", "plant_manager"], ["PENDING_PROD", "PENDING_PLANT", "APPROVED"]),
    )
    init_db()
    clear_complaints()
    for cost, roles, expected_statuses in scenarios:
        complaint = create_complaint(
            ComplaintCreate(machine_id="M-101", problem_type="Vibration", severity="HIGH"),
            submitted_by="tech@praxis.local",
        )
        attach_decision(complaint.complaint_id, {"expected_cost": cost}, cost)
        for role, expected_status in zip(roles, expected_statuses, strict=True):
            updated = approve_complaint(complaint.complaint_id, f"{role}@praxis.local", role)
            assert updated.status == expected_status
