# AM&POP Decision Contract

This document defines the common language for the AM&POP system. All modules (backend, ML, optimization, frontend) must use these exact structures. The typed Pydantic models in `backend/app/models.py` implement this contract.

## 1. DecisionRequest
**Purpose:** The initial input from the user or system.
- `request_id`: Unique identifier (UUID)
- `machine_id`: The machine being evaluated (e.g., M17)
- `timestamp`: ISO 8601 datetime

## 2. DecisionContext
**Purpose:** The structured state and constraints of the current situation.
- `machine_state`: Current readings (temperature, status, etc.)
- `operational_constraints`: Deadlines, budget, technician availability, etc.
- `priority`: Production priority (e.g., HIGH, MEDIUM, LOW)

## 3. CandidateAction
**Purpose:** A possible action the system can take.
- `action_id`: Unique identifier for the action (A, B, C, D)
- `action_type`: REPAIR_NOW, CONTINUE_TEMP, REDUCE_PROD, REALLOCATE
- `description`: Human-readable description

## 4. Prediction
**Purpose:** The ML model's forecasted outcome for a specific action.
- `action_id`: Links to the CandidateAction
- `predicted_downtime_hours`: Float
- `predicted_cost`: Float
- `predicted_risk_score`: Float (0.0 to 1.0)
- `confidence`: Float (0.0 to 1.0)

## 5. ConstraintResult
**Purpose:** The result of checking hard constraints for a specific action.
- `action_id`: Links to the CandidateAction
- `is_feasible`: Boolean
- `violations`: List of strings (e.g., "Technician unavailable")

## 6. OptimizationResult
**Purpose:** The result of evaluating all feasible actions against the objective.
- `feasible_actions`: List of action_ids
- `scores`: Map of action_id to weighted score (Cost + Downtime + Risk)
- `best_action_id`: The winning action_id

## 7. DecisionResult
**Purpose:** The final structured output recommended by AM&POP.
- `decision_id`: Unique identifier
- `recommended_action_id`: The best action
- `expected_cost`: Float
- `expected_downtime`: Float
- `expected_risk`: String (LOW, MEDIUM, HIGH)
- `confidence`: Float
- `reason`: Text explanation of why this action won

## 8. Approval
**Purpose:** Records the human-in-the-loop sign-off.
- `decision_id`: Links to the DecisionResult
- `status`: PENDING, APPROVED, REJECTED
- `approver_id`: User ID
- `timestamp`: ISO 8601 datetime

## 9. Outcome
**Purpose:** The actual result after execution.
- `decision_id`: Links to the DecisionResult
- `actual_downtime_hours`: Float
- `actual_cost`: Float
- `success`: Boolean
- `notes`: Text

## 10. Experience
**Purpose:** The stored memory for future learning.
- `situation_summary`: Serialized DecisionContext
- `decision_taken`: Serialized DecisionResult
- `prediction_accuracy`: Delta between predicted and actual
- `outcome`: Serialized Outcome

## 11. Workflow and lifecycle rules

1. `DecisionEvaluationRequest` contains a formal `MaintenanceRequest`, a
   `MachineState`, and `OperationalConstraints`.
2. Formal validation must accept the maintenance request before the remaining
   decision stages run.
3. A created `DecisionResult` receives an `Approval` with `PENDING` status.
4. A pending decision can be approved or rejected exactly once by a named
   approver. `PENDING` cannot be submitted as an approval update.
5. Only an approved decision can receive one `Outcome`.
6. Recording an outcome appends an `Experience`, including cost and downtime
   deltas between the decision forecast and actual result.

All API input models forbid unknown fields. This keeps each decision request
explicit and its audit trail stable as downstream components evolve.
