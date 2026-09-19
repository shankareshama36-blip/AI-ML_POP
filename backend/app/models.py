"""Shared, typed contracts for the AM&POP maintenance decision workflow."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field

from backend.app.formal_engine import DfaValidationResult, MaintenanceRequest


class ContractModel(BaseModel):
    """Base model that keeps API contracts explicit and reject unknown fields."""

    model_config = ConfigDict(extra="forbid")


class MachineStatus(str, Enum):
    RUNNING = "RUNNING"
    DEGRADED = "DEGRADED"
    OFFLINE = "OFFLINE"


class ActionType(str, Enum):
    REPAIR_NOW = "REPAIR_NOW"
    CONTINUE_TEMP = "CONTINUE_TEMP"
    REDUCE_PROD = "REDUCE_PROD"
    REALLOCATE = "REALLOCATE"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class MachineState(ContractModel):
    """Current, observable machine readings used by the decision engine."""

    temperature_c: float = Field(..., ge=-20, le=200)
    vibration_mm_s: float = Field(..., ge=0, le=100)
    operating_hours: int = Field(..., ge=0)
    status: MachineStatus = MachineStatus.RUNNING


class OperationalConstraints(ContractModel):
    """Hard limits and economic weights supplied by operations."""

    max_budget: float = Field(..., ge=0)
    max_downtime_hours: float = Field(..., gt=0)
    deadline_hours: float = Field(..., gt=0)
    technicians_available: bool
    spare_parts_available: bool
    downtime_cost_per_hour: float = Field(default=1_000, ge=0)
    risk_cost_factor: float = Field(default=10_000, ge=0)


class DecisionContext(ContractModel):
    """Structured situation passed from validation to later decision stages."""

    machine_state: MachineState
    operational_constraints: OperationalConstraints
    priority: str
    condition: str


class DecisionEvaluationRequest(ContractModel):
    """One complete maintenance situation submitted to the decision loop."""

    request_id: UUID = Field(default_factory=uuid4)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    maintenance_request: MaintenanceRequest
    machine_state: MachineState
    operational_constraints: OperationalConstraints


class CandidateAction(ContractModel):
    action_id: str
    action_type: ActionType
    description: str


class Prediction(ContractModel):
    action_id: str
    predicted_downtime_hours: float = Field(..., ge=0)
    predicted_cost: float = Field(..., ge=0)
    predicted_risk_score: float = Field(..., ge=0, le=1)
    confidence: float = Field(..., ge=0, le=1)


class ConstraintResult(ContractModel):
    action_id: str
    is_feasible: bool
    violations: list[str]


class OptimizationResult(ContractModel):
    feasible_actions: list[str]
    scores: dict[str, float]
    best_action_id: str


class DecisionResult(ContractModel):
    decision_id: UUID = Field(default_factory=uuid4)
    recommended_action_id: str
    expected_cost: float = Field(..., ge=0)
    expected_downtime: float = Field(..., ge=0)
    expected_risk: RiskLevel
    confidence: float = Field(..., ge=0, le=1)
    reason: str


class Approval(ContractModel):
    decision_id: UUID
    status: ApprovalStatus
    approver_id: str | None = None
    timestamp: datetime


class ApprovalUpdate(ContractModel):
    """Human-in-the-loop status update for a pending decision."""

    status: ApprovalStatus
    approver_id: str = Field(..., min_length=1, max_length=128)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Outcome(ContractModel):
    decision_id: UUID
    actual_downtime_hours: float = Field(..., ge=0)
    actual_cost: float = Field(..., ge=0)
    success: bool
    notes: str = Field(default="", max_length=2_000)
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OutcomeCreate(ContractModel):
    actual_downtime_hours: float = Field(..., ge=0)
    actual_cost: float = Field(..., ge=0)
    success: bool
    notes: str = Field(default="", max_length=2_000)
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Experience(ContractModel):
    """A completed decision retained for future learning and auditability."""

    decision_id: UUID
    situation_summary: dict[str, Any]
    decision_taken: dict[str, Any]
    prediction_accuracy: dict[str, float]
    outcome: Outcome


class DecisionWorkflowResponse(ContractModel):
    """Traceable output of every stage in a decision evaluation."""

    request_id: UUID
    timestamp: datetime
    formal_validation: DfaValidationResult
    context: DecisionContext
    candidate_actions: list[CandidateAction]
    predictions: list[Prediction]
    constraint_results: list[ConstraintResult]
    optimization: OptimizationResult
    decision: DecisionResult
    approval: Approval
    outcome: Outcome | None = None
