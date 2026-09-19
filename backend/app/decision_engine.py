"""Decision-loop stages for the V1 AM&POP engine.

Stage 1: Formal validation (in formal_engine)
Stage 2: Context building
Stage 3: Action generation
Stage 4: ML prediction (scikit-learn models)
Stage 5: Constraint evaluation
Stage 6: Dijkstra optimization
Stage 7: Decision construction
"""

from __future__ import annotations

import heapq
from dataclasses import dataclass
from typing import Final

from backend.app.formal_engine import MaintenanceRequest, normalize_value
from backend.app.models import (
    ActionType,
    CandidateAction,
    ConstraintResult,
    DecisionContext,
    DecisionResult,
    MachineState,
    OperationalConstraints,
    OptimizationResult,
    Prediction,
    RiskLevel,
)

CONDITION_SEVERITY: Final[dict[str, int]] = {
    "NORMAL": 0,
    "WARN": 1,
    "ALERT": 2,
    "CRITICAL": 3,
}
PRIORITY_MULTIPLIER: Final[dict[str, float]] = {
    "LOW": 0.9,
    "MEDIUM": 1.0,
    "HIGH": 1.15,
    "CRITICAL": 1.35,
}


class NoFeasibleActionError(ValueError):
    """Raised when every candidate action violates a hard constraint."""


@dataclass(frozen=True)
class EvaluationArtifacts:
    context: DecisionContext
    candidate_actions: list[CandidateAction]
    predictions: list[Prediction]
    constraint_results: list[ConstraintResult]
    optimization: OptimizationResult
    decision: DecisionResult


def build_context(
    request: MaintenanceRequest,
    machine_state: MachineState,
    operational_constraints: OperationalConstraints,
) -> DecisionContext:
    """Convert the validated request into a single operational state object."""

    return DecisionContext(
        machine_state=machine_state,
        operational_constraints=operational_constraints,
        priority=normalize_value(request.priority),
        condition=normalize_value(request.condition),
    )


def generate_candidate_actions() -> list[CandidateAction]:
    """Generate the bounded V1 action vocabulary."""

    return [
        CandidateAction(
            action_id="A",
            action_type=ActionType.REPAIR_NOW,
            description="Stop the machine and repair it immediately.",
        ),
        CandidateAction(
            action_id="B",
            action_type=ActionType.CONTINUE_TEMP,
            description="Keep operating temporarily under closer monitoring.",
        ),
        CandidateAction(
            action_id="C",
            action_type=ActionType.REDUCE_PROD,
            description="Reduce production load until maintenance is completed.",
        ),
        CandidateAction(
            action_id="D",
            action_type=ActionType.REALLOCATE,
            description="Reallocate work to another production line.",
        ),
    ]


def _severity(context: DecisionContext) -> float:
    """Combine reported condition and readings into a bounded risk severity."""

    condition = CONDITION_SEVERITY[context.condition]
    temperature = max(0.0, (context.machine_state.temperature_c - 70) / 25)
    vibration = max(0.0, (context.machine_state.vibration_mm_s - 4) / 4)
    return min(3.0, max(float(condition), temperature, vibration))


def predict_outcomes(
    actions: list[CandidateAction], context: DecisionContext
) -> list[Prediction]:
    """Predict outcomes using trained scikit-learn models."""
    from backend.app.prediction import get_engine

    engine = get_engine()
    ms = context.machine_state
    results: list[Prediction] = []

    for action in actions:
        action_type = (
            action.action_type.value
            if hasattr(action.action_type, "value")
            else str(action.action_type)
        )
        downtime, cost, risk, confidence = engine.predict(
            temperature_c=float(getattr(ms, "temperature_c", 70.0)),
            vibration_mm_s=float(getattr(ms, "vibration_mm_s", 3.0)),
            tool_wear_min=float(getattr(ms, "tool_wear_min", 0.0)),
            condition=str(context.condition),
            priority=str(context.priority),
            action_type=action_type,
        )
        results.append(
            Prediction(
                action_id=action.action_id,
                predicted_downtime_hours=round(downtime, 2),
                predicted_cost=round(cost, 2),
                predicted_risk_score=round(risk, 3),
                confidence=round(confidence, 3),
            )
        )
    return results


def evaluate_constraints(
    actions: list[CandidateAction],
    predictions: list[Prediction],
    context: DecisionContext,
) -> list[ConstraintResult]:
    """Evaluate every hard operational and safety constraint."""

    prediction_by_action = {
        prediction.action_id: prediction for prediction in predictions
    }
    results: list[ConstraintResult] = []
    for action in actions:
        prediction = prediction_by_action[action.action_id]
        violations: list[str] = []
        limits = context.operational_constraints

        if prediction.predicted_cost > limits.max_budget:
            violations.append("Exceeds maximum budget")
        if prediction.predicted_downtime_hours > limits.max_downtime_hours:
            violations.append("Exceeds maximum downtime")
        if prediction.predicted_downtime_hours > limits.deadline_hours:
            violations.append("Cannot meet maintenance deadline")
        if action.action_type is ActionType.REPAIR_NOW:
            if not limits.technicians_available:
                violations.append("Technician unavailable for immediate repair")
            if not limits.spare_parts_available:
                violations.append("Required spare parts unavailable")
        if action.action_type is ActionType.CONTINUE_TEMP:
            if context.condition in {"ALERT", "CRITICAL"}:
                violations.append("Unsafe to continue at the reported condition")
            if context.machine_state.status.value == "OFFLINE":
                violations.append("Offline machine cannot continue operating")

        results.append(
            ConstraintResult(
                action_id=action.action_id,
                is_feasible=not violations,
                violations=violations,
            )
        )
    return results


def _dijkstra_shortest_paths(
    graph: dict[str, dict[str, float]], source: str
) -> dict[str, float]:
    """Compute shortest paths for the one-hop action-selection graph."""

    distances = {node: float("inf") for node in graph}
    distances[source] = 0.0
    queue: list[tuple[float, str]] = [(0.0, source)]
    while queue:
        distance, node = heapq.heappop(queue)
        if distance != distances[node]:
            continue
        for neighbor, weight in graph[node].items():
            candidate = distance + weight
            if candidate < distances[neighbor]:
                distances[neighbor] = candidate
                heapq.heappush(queue, (candidate, neighbor))
    return distances


def optimize_actions(
    predictions: list[Prediction],
    constraint_results: list[ConstraintResult],
    operational_constraints: OperationalConstraints,
) -> OptimizationResult:
    """Use Dijkstra's algorithm to select the lowest-cost feasible action.

    Each feasible action is an edge from a synthetic source node.  The edge
    weight combines direct cost, downtime impact, and risk exposure.
    """

    feasible_ids = {
        result.action_id for result in constraint_results if result.is_feasible
    }
    if not feasible_ids:
        raise NoFeasibleActionError(
            "No candidate action satisfies all hard constraints"
        )

    scores = {
        prediction.action_id: round(
            prediction.predicted_cost
            + prediction.predicted_downtime_hours
            * operational_constraints.downtime_cost_per_hour
            + prediction.predicted_risk_score
            * operational_constraints.risk_cost_factor,
            2,
        )
        for prediction in predictions
        if prediction.action_id in feasible_ids
    }
    graph = {"SOURCE": scores, **{action_id: {} for action_id in scores}}
    distances = _dijkstra_shortest_paths(graph, "SOURCE")
    best_action_id = min(
        scores, key=lambda action_id: (distances[action_id], action_id)
    )
    return OptimizationResult(
        feasible_actions=sorted(feasible_ids),
        scores=scores,
        best_action_id=best_action_id,
    )


def _risk_level(score: float) -> RiskLevel:
    if score < 0.25:
        return RiskLevel.LOW
    if score < 0.55:
        return RiskLevel.MEDIUM
    return RiskLevel.HIGH


def build_decision(
    actions: list[CandidateAction],
    predictions: list[Prediction],
    optimization: OptimizationResult,
) -> DecisionResult:
    """Turn optimization output into a human-readable recommendation."""

    action = next(
        item for item in actions if item.action_id == optimization.best_action_id
    )
    prediction = next(
        item for item in predictions if item.action_id == optimization.best_action_id
    )
    return DecisionResult(
        recommended_action_id=action.action_id,
        expected_cost=prediction.predicted_cost,
        expected_downtime=prediction.predicted_downtime_hours,
        expected_risk=_risk_level(prediction.predicted_risk_score),
        confidence=prediction.confidence,
        reason=(
            f"{action.action_type.value} is the lowest-scoring feasible action "
            f"({optimization.scores[action.action_id]:.2f}) after cost, downtime, "
            "risk, and hard constraints were evaluated."
        ),
    )


def evaluate_decision(
    request: MaintenanceRequest,
    machine_state: MachineState,
    operational_constraints: OperationalConstraints,
) -> EvaluationArtifacts:
    """Run all stages after the formal request has been accepted."""

    context = build_context(request, machine_state, operational_constraints)
    actions = generate_candidate_actions()
    predictions = predict_outcomes(actions, context)
    constraints = evaluate_constraints(actions, predictions, context)
    optimization = optimize_actions(predictions, constraints, operational_constraints)
    decision = build_decision(actions, predictions, optimization)
    return EvaluationArtifacts(
        context=context,
        candidate_actions=actions,
        predictions=predictions,
        constraint_results=constraints,
        optimization=optimization,
        decision=decision,
    )
