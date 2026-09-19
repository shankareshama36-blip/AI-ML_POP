from __future__ import annotations

from enum import Enum
from typing import Final

from pydantic import BaseModel, ConfigDict, Field


class DfaState(str, Enum):
    """Explicit states in the maintenance-request validation DFA."""

    START = "START"
    MACHINE_VALID = "MACHINE_VALID"
    TYPE_VALID = "TYPE_VALID"
    PRIORITY_VALID = "PRIORITY_VALID"
    CONDITION_VALID = "CONDITION_VALID"
    ACTION_VALID = "ACTION_VALID"
    ACCEPT = "ACCEPT"
    REJECT = "REJECT"


class InputSymbol(str, Enum):
    """The categories consumed by the DFA as it validates a request."""

    MACHINE_ID = "MACHINE_ID"
    MAINTENANCE_TYPE = "MAINTENANCE_TYPE"
    PRIORITY = "PRIORITY"
    CONDITION = "CONDITION"
    ACTION = "ACTION"
    INVALID = "INVALID"
    END_OF_REQUEST = "END_OF_REQUEST"


class MaintenanceRequest(BaseModel):
    """Minimal maintenance request for the V1 formal validation stage."""

    model_config = ConfigDict(extra="forbid")

    machine_id: str = Field(..., description="Machine or equipment identifier")
    maintenance_type: str = Field(..., description="Maintenance category")
    priority: str = Field(..., description="Operational urgency")
    condition: str = Field(..., description="Reported machine condition")
    action: str = Field(..., description="Requested action")


class DfaValidationResult(BaseModel):
    """Structured result returned by the DFA validator."""

    accepted: bool
    final_state: str
    reason: str
    failed_at_position: str | None = None
    trace: list[str]


ALLOWED_MACHINE_IDS: Final[frozenset[str]] = frozenset(
    {
        "M-101",
        "M-102",
        "M-201",
        "M-220",
        "M-303",
        "M-404",
        "M-510",
    }
)
ALLOWED_MAINTENANCE_TYPES: Final[frozenset[str]] = frozenset(
    {"PREVENTIVE", "CORRECTIVE", "INSPECTION", "PREDICTIVE"}
)
ALLOWED_PRIORITIES: Final[frozenset[str]] = frozenset(
    {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
)
ALLOWED_CONDITIONS: Final[frozenset[str]] = frozenset(
    {"NORMAL", "WARN", "ALERT", "CRITICAL"}
)
ALLOWED_ACTIONS: Final[frozenset[str]] = frozenset(
    {"INSPECT", "REPAIR", "REPLACE", "SHUTDOWN", "PAUSE_PRODUCTION"}
)

FIELD_VALID_VALUES: Final[dict[str, frozenset[str]]] = {
    "machine_id": ALLOWED_MACHINE_IDS,
    "maintenance_type": ALLOWED_MAINTENANCE_TYPES,
    "priority": ALLOWED_PRIORITIES,
    "condition": ALLOWED_CONDITIONS,
    "action": ALLOWED_ACTIONS,
}

FIELD_REASON_LABELS: Final[dict[str, str]] = {
    "machine_id": "machine identifier",
    "maintenance_type": "maintenance type",
    "priority": "priority",
    "condition": "condition/state",
    "action": "requested action",
}

VALIDATION_ORDER: Final[list[tuple[str, InputSymbol]]] = [
    ("machine_id", InputSymbol.MACHINE_ID),
    ("maintenance_type", InputSymbol.MAINTENANCE_TYPE),
    ("priority", InputSymbol.PRIORITY),
    ("condition", InputSymbol.CONDITION),
    ("action", InputSymbol.ACTION),
]


def normalize_value(value: str) -> str:
    """Normalize runtime input to a deterministic DFA vocabulary."""

    return value.strip().upper()


def transition(current_state: DfaState, input_symbol: InputSymbol) -> DfaState:
    """Deterministic transition function δ(state, symbol) -> next_state."""

    if input_symbol is InputSymbol.INVALID:
        return DfaState.REJECT

    transitions: Final[dict[DfaState, dict[InputSymbol, DfaState]]] = {
        DfaState.START: {
            InputSymbol.MACHINE_ID: DfaState.MACHINE_VALID,
        },
        DfaState.MACHINE_VALID: {
            InputSymbol.MAINTENANCE_TYPE: DfaState.TYPE_VALID,
        },
        DfaState.TYPE_VALID: {
            InputSymbol.PRIORITY: DfaState.PRIORITY_VALID,
        },
        DfaState.PRIORITY_VALID: {
            InputSymbol.CONDITION: DfaState.CONDITION_VALID,
        },
        DfaState.CONDITION_VALID: {
            InputSymbol.ACTION: DfaState.ACTION_VALID,
        },
        DfaState.ACTION_VALID: {
            InputSymbol.END_OF_REQUEST: DfaState.ACCEPT,
        },
        DfaState.ACCEPT: {
            InputSymbol.MACHINE_ID: DfaState.ACCEPT,
            InputSymbol.MAINTENANCE_TYPE: DfaState.ACCEPT,
            InputSymbol.PRIORITY: DfaState.ACCEPT,
            InputSymbol.CONDITION: DfaState.ACCEPT,
            InputSymbol.ACTION: DfaState.ACCEPT,
        },
        DfaState.REJECT: {
            InputSymbol.MACHINE_ID: DfaState.REJECT,
            InputSymbol.MAINTENANCE_TYPE: DfaState.REJECT,
            InputSymbol.PRIORITY: DfaState.REJECT,
            InputSymbol.CONDITION: DfaState.REJECT,
            InputSymbol.ACTION: DfaState.REJECT,
        },
    }

    return transitions.get(current_state, {}).get(input_symbol, DfaState.REJECT)


def validate_maintenance_request(
    request: MaintenanceRequest | dict[str, str],
) -> DfaValidationResult:
    """Validate a structured request using the explicit maintenance DFA."""

    payload = (
        MaintenanceRequest.model_validate(request)
        if isinstance(request, dict)
        else request
    )
    current_state = DfaState.START
    trace = [current_state.value]

    for field_name, input_symbol in VALIDATION_ORDER:
        normalized_value = normalize_value(str(getattr(payload, field_name)))

        if normalized_value not in FIELD_VALID_VALUES[field_name]:
            next_state = transition(current_state, InputSymbol.INVALID)
            trace.append(next_state.value)
            return DfaValidationResult(
                accepted=False,
                final_state=next_state.value,
                reason=f"Invalid {FIELD_REASON_LABELS[field_name]}",
                failed_at_position=field_name,
                trace=trace,
            )

        current_state = transition(current_state, input_symbol)
        trace.append(current_state.value)

    current_state = transition(current_state, InputSymbol.END_OF_REQUEST)
    trace.append(current_state.value)

    return DfaValidationResult(
        accepted=True,
        final_state=current_state.value,
        reason="Maintenance request is valid",
        failed_at_position=None,
        trace=trace,
    )
