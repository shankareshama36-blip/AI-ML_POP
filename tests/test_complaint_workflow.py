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
            submitted_by="tech@praxis.local", tenant_id="00000000-0000-0000-0000-000000000000",
        )
        attach_decision(complaint.complaint_id, {"expected_cost": cost}, cost, tenant_id="00000000-0000-0000-0000-000000000000")
        for role, expected_status in zip(roles, expected_statuses, strict=True):
            updated = approve_complaint(
                complaint.complaint_id,
                f"{role}@praxis.local",
                role,
                tenant_id="00000000-0000-0000-0000-000000000000",
            )
            assert updated.status == expected_status


def test_role_must_match_current_pending_status() -> None:
    """Verifies that unauthorized roles cannot approve complaints out of order."""
    import pytest

    init_db()
    clear_complaints()

    complaint = create_complaint(
        ComplaintCreate(machine_id="M-102", problem_type="Spindle Bearing Wear", severity="CRITICAL"),
        submitted_by="tech@praxis.local", tenant_id="00000000-0000-0000-0000-000000000000",
    )
    attach_decision(complaint.complaint_id, {"expected_cost": 55_000}, 55_000, tenant_id="00000000-0000-0000-0000-000000000000")

    # Status is PENDING_MAINT; production_supervisor and plant_manager must be rejected
    with pytest.raises(ValueError, match="cannot approve"):
        approve_complaint(
            complaint.complaint_id,
            "prod@praxis.local",
            "production_supervisor",
            tenant_id="00000000-0000-0000-0000-000000000000",
        )
    with pytest.raises(ValueError, match="cannot approve"):
        approve_complaint(
            complaint.complaint_id,
            "plant@praxis.local",
            "plant_manager",
            tenant_id="00000000-0000-0000-0000-000000000000",
        )

    # Maintenance supervisor approves -> transitions to PENDING_PROD
    step1 = approve_complaint(
        complaint.complaint_id,
        "maint@praxis.local",
        "maintenance_supervisor",
        tenant_id="00000000-0000-0000-0000-000000000000",
    )
    assert step1.status == "PENDING_PROD"

    # Status is now PENDING_PROD; maintenance_supervisor and plant_manager must be rejected
    with pytest.raises(ValueError, match="cannot approve"):
        approve_complaint(
            complaint.complaint_id,
            "maint@praxis.local",
            "maintenance_supervisor",
            tenant_id="00000000-0000-0000-0000-000000000000",
        )
    with pytest.raises(ValueError, match="cannot approve"):
        approve_complaint(
            complaint.complaint_id,
            "plant@praxis.local",
            "plant_manager",
            tenant_id="00000000-0000-0000-0000-000000000000",
        )

    # Production supervisor approves -> transitions to PENDING_PLANT
    step2 = approve_complaint(
        complaint.complaint_id,
        "prod@praxis.local",
        "production_supervisor",
        tenant_id="00000000-0000-0000-0000-000000000000",
    )
    assert step2.status == "PENDING_PLANT"

    # Status is now PENDING_PLANT; maintenance_supervisor and production_supervisor must be rejected
    with pytest.raises(ValueError, match="cannot approve"):
        approve_complaint(
            complaint.complaint_id,
            "maint@praxis.local",
            "maintenance_supervisor",
            tenant_id="00000000-0000-0000-0000-000000000000",
        )
    with pytest.raises(ValueError, match="cannot approve"):
        approve_complaint(
            complaint.complaint_id,
            "prod@praxis.local",
            "production_supervisor",
            tenant_id="00000000-0000-0000-0000-000000000000",
        )

    # Plant manager approves -> transitions to APPROVED
    step3 = approve_complaint(
        complaint.complaint_id,
        "plant@praxis.local",
        "plant_manager",
        tenant_id="00000000-0000-0000-0000-000000000000",
    )
    assert step3.status == "APPROVED"

