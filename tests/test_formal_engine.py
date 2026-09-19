import pytest

from backend.app.formal_engine import (
    DfaState,
    InputSymbol,
    MaintenanceRequest,
    transition,
    validate_maintenance_request,
)

VALID_REQUEST = {
    "machine_id": "M-101",
    "maintenance_type": "PREVENTIVE",
    "priority": "HIGH",
    "condition": "WARN",
    "action": "INSPECT",
}


def test_valid_request_reaches_accept_with_complete_trace() -> None:
    result = validate_maintenance_request(VALID_REQUEST)

    assert result.accepted is True
    assert result.final_state == DfaState.ACCEPT.value
    assert result.failed_at_position is None
    assert result.trace == [
        DfaState.START.value,
        DfaState.MACHINE_VALID.value,
        DfaState.TYPE_VALID.value,
        DfaState.PRIORITY_VALID.value,
        DfaState.CONDITION_VALID.value,
        DfaState.ACTION_VALID.value,
        DfaState.ACCEPT.value,
    ]


def test_validator_normalizes_case_and_whitespace() -> None:
    request = {
        "machine_id": " m-101 ",
        "maintenance_type": " preventive ",
        "priority": " high ",
        "condition": " warn ",
        "action": " inspect ",
    }

    result = validate_maintenance_request(request)

    assert result.accepted is True
    assert result.final_state == DfaState.ACCEPT.value


@pytest.mark.parametrize(
    ("field_name", "invalid_value", "expected_prefix"),
    [
        ("machine_id", "M-999", [DfaState.START.value]),
        (
            "maintenance_type",
            "EMERGENCY",
            [DfaState.START.value, DfaState.MACHINE_VALID.value],
        ),
        (
            "priority",
            "URGENT",
            [
                DfaState.START.value,
                DfaState.MACHINE_VALID.value,
                DfaState.TYPE_VALID.value,
            ],
        ),
        (
            "condition",
            "FAILING",
            [
                DfaState.START.value,
                DfaState.MACHINE_VALID.value,
                DfaState.TYPE_VALID.value,
                DfaState.PRIORITY_VALID.value,
            ],
        ),
        (
            "action",
            "REBOOT",
            [
                DfaState.START.value,
                DfaState.MACHINE_VALID.value,
                DfaState.TYPE_VALID.value,
                DfaState.PRIORITY_VALID.value,
                DfaState.CONDITION_VALID.value,
            ],
        ),
    ],
)
def test_invalid_field_reaches_reject(
    field_name: str,
    invalid_value: str,
    expected_prefix: list[str],
) -> None:
    request = {**VALID_REQUEST, field_name: invalid_value}

    result = validate_maintenance_request(request)

    assert result.accepted is False
    assert result.final_state == DfaState.REJECT.value
    assert result.failed_at_position == field_name
    assert result.trace == [*expected_prefix, DfaState.REJECT.value]


def test_validator_is_deterministic() -> None:
    request = MaintenanceRequest(**VALID_REQUEST)

    first_result = validate_maintenance_request(request)
    second_result = validate_maintenance_request(request)

    assert first_result == second_result


def test_transition_function_rejects_invalid_and_accepts_completed_request() -> None:
    assert transition(DfaState.TYPE_VALID, InputSymbol.INVALID) is DfaState.REJECT
    assert (
        transition(DfaState.ACTION_VALID, InputSymbol.END_OF_REQUEST)
        is DfaState.ACCEPT
    )
