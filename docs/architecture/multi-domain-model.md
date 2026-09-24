# AM&POP Generic Multi-Domain Data Model Architecture

## 1. Purpose
AM&POP is designed as an autonomous, grounded decision-making architecture, not a single-purpose factory maintenance utility. While factory maintenance serves as the inaugural reference implementation ("Domain Pack 1"), real-world decision-making across domains shares an identical invariant structure: intake an operational situation, validate state boundaries, evaluate prospective actions, estimate consequence trade-offs, enforce non-negotiable constraints, optimize objective criteria, require auditable authorization, and record grounded post-decision outcomes to build experiential memory.

By establishing a declarative, domain-agnostic metadata layer, AM&POP allows organizations to define arbitrary domains (healthcare, retail, personal finance, education, logistics, SaaS billing) through schema and configuration rather than bespoke code changes.

---

## 2. Core Abstraction: The Universal Decision Loop
Every domain decision follows the 11-stage invariant decision lifecycle:

```text
[INPUT]               Intake raw request and contextual operational readings
   ↓
[VALIDATION]          Formal boundary & syntax verification (DFA / JSON Schema)
   ↓
[STATE]               Unified operational snapshot combining readings & metadata
   ↓
[ACTIONS]             Candidate action generator producing allowable options
   ↓
[PREDICTION]          Estimation of consequences (cost, delay/downtime, risk, quality)
   ↓
[CONSTRAINTS]         Feasibility evaluation against hard limits & invariant rules
   ↓
[OPTIMIZATION]        Shortest-path / multi-objective scoring across feasible set
   ↓
[DECISION]            Selection of optimal action, confidence score, and rationale
   ↓
[APPROVAL]            Human-in-the-loop or policy-based sign-off and auditing
   ↓
[OUTCOME]             Ground-truth post-execution telemetry and impact capture
   ↓
[EXPERIENCE MEMORY]   Closed-loop feedback storage for drift detection & model retraining
```

---

## 3. Generic Data Model

### Entity Definitions

#### User
Represents an authenticated actor or service account interacting with the platform.
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `name`: String
- `role`: Enum (`ADMIN`, `OPERATOR`, `APPROVER`, `VIEWER`)
- `created_at`: Timestamp

#### Workspace
Multi-tenant isolation boundary for teams, facilities, or organizations.
- `id`: UUID (Primary Key)
- `name`: String
- `slug`: String (Unique per tenant)
- `created_at`: Timestamp

#### Domain
Defines a specific decision space within a workspace (e.g., `factory_maintenance`, `personal_finance`).
- `id`: UUID (Primary Key)
- `workspace_id`: UUID (Foreign Key -> Workspace.id)
- `name`: String (e.g., "Factory Operations")
- `code`: String (Unique within workspace, e.g., "factory_ops")
- `description`: Text
- `formal_validation_schema`: JSON / DFA Transition Table
- `scoring_weights`: JSON (Default weights for downtime, cost, risk factor)
- `is_active`: Boolean
- `created_at`: Timestamp

#### Entity (What gets decided about)
The core subject undergoing evaluation (e.g., equipment, transaction, student, invoice).
- `id`: UUID (Primary Key)
- `domain_id`: UUID (Foreign Key -> Domain.id)
- `external_reference_id`: String (e.g., "M-101", "INV-9021")
- `name`: String
- `status`: String (Domain-specific current state)
- `metadata`: JSON (Domain-specific static attributes)
- `created_at`: Timestamp
- `updated_at`: Timestamp

#### EntityField (User-defined field definition)
Schema definition for observable parameters, telemetry, and request payloads.
- `id`: UUID (Primary Key)
- `domain_id`: UUID (Foreign Key -> Domain.id)
- `field_key`: String (e.g., "temperature_c", "monthly_income")
- `display_label`: String
- `data_type`: Enum (`FLOAT`, `INTEGER`, `STRING`, `BOOLEAN`, `DATETIME`, `ENUM`)
- `validation_rules`: JSON (e.g., `{"min": -20, "max": 200, "required": true}`)
- `field_category`: Enum (`REQUEST_PARAM`, `OBSERVED_STATE`, `CONSTRAINT_PARAM`)

#### ActionDefinition
Allowable prospective interventions or actions defined for a domain.
- `id`: UUID (Primary Key)
- `domain_id`: UUID (Foreign Key -> Domain.id)
- `action_code`: String (e.g., "REPAIR_NOW", "DEFER")
- `title`: String
- `description`: Text
- `is_terminal`: Boolean (Whether this action pauses/halts standard workflow)
- `active`: Boolean

#### ConstraintDefinition
User-defined hard boundaries and business invariants that cannot be breached.
- `id`: UUID (Primary Key)
- `domain_id`: UUID (Foreign Key -> Domain.id)
- `constraint_code`: String (e.g., "MAX_BUDGET", "CASH_FLOW_BUFFER")
- `expression`: String (e.g., `predicted_cost <= operational_constraints.max_budget`)
- `error_message`: String (e.g., "Estimated cost exceeds maximum allocated budget")
- `is_hard`: Boolean (True = drops action immediately; False = penalty factor)

#### DecisionRecord
Traceable log of a decision execution across the entire loop.
- `id`: UUID (Primary Key)
- `domain_id`: UUID (Foreign Key -> Domain.id)
- `entity_id`: UUID (Foreign Key -> Entity.id)
- `raw_input`: JSON (Complete incoming state, requests, and limits)
- `formal_validation_result`: JSON (DFA trace, acceptance status, reason)
- `predictions`: JSON (List of candidate action outcome projections)
- `constraint_results`: JSON (Feasibility status and violation lists per action)
- `optimization_scores`: JSON (Calculated utility / cost scores)
- `recommended_action_id`: String
- `expected_cost`: Float
- `expected_delay`: Float (Downtime, processing delay, or turnaround)
- `expected_risk`: String / Float
- `confidence`: Float
- `rationale`: Text
- `approval_status`: Enum (`PENDING`, `APPROVED`, `REJECTED`, `AUTO_APPROVED`)
- `approver_id`: UUID (Nullable, Foreign Key -> User.id)
- `approved_at`: Timestamp (Nullable)
- `created_at`: Timestamp

#### OutcomeRecord
Ground-truth measurements collected after the decision is executed in the real world.
- `id`: UUID (Primary Key)
- `decision_id`: UUID (Foreign Key -> DecisionRecord.id, Unique)
- `actual_delay`: Float (Actual downtime or delay incurred)
- `actual_cost`: Float (Actual expense incurred)
- `success`: Boolean
- `incident_occurred`: Boolean
- `notes`: Text
- `recorded_by`: UUID (Foreign Key -> User.id)
- `recorded_at`: Timestamp

#### ExperienceEntry
Feedback memory pairing situation context, decision taken, and prediction error.
- `id`: UUID (Primary Key)
- `domain_id`: UUID (Foreign Key -> Domain.id)
- `decision_id`: UUID (Foreign Key -> DecisionRecord.id)
- `situation_vector`: JSON / Binary (Normalized state features)
- `decision_taken`: String (Action code)
- `prediction_error`: JSON (Delta between predicted and actual metrics)
- `created_at`: Timestamp

### Entity Relationships Diagram

```text
+---------------+       1:N       +-------------------+
|   Workspace   | --------------< |      Domain       |
+---------------+                 +-------------------+
                                            |
         +------------------+---------------+------------------+
         | 1:N              | 1:N           | 1:N              | 1:N
         v                  v               v                  v
+------------------+ +---------------+ +---------------+ +--------------------+
|   EntityField    | | ActionDef     | | ConstraintDef | |       Entity       |
+------------------+ +---------------+ +---------------+ +--------------------+
                                                                   | 1:N
                                                                   v
+-------------------+       1:1           +-----------------------------------+
|   OutcomeRecord   | <------------------ |          DecisionRecord           |
+-------------------+                     +-----------------------------------+
                                                            | 1:1
                                                            v
                                                  +-------------------+
                                                  |  ExperienceEntry  |
                                                  +-------------------+
```

---

## 4. How Factory Maintenance Maps to this Model

| Factory Maintenance Concept (V1) | Generic Multi-Domain Entity & Field Instance |
| :--- | :--- |
| **Domain** | `Domain`: code = `"factory_maintenance"`, name = `"Plant Maintenance"` |
| **Machine (`M-101`)** | `Entity`: external_reference_id = `"M-101"`, status = `"DEGRADED"` |
| **`temperature_c`** | `EntityField`: field_key = `"temperature_c"`, data_type = `FLOAT`, min = `-20`, max = `200` |
| **`vibration_mm_s`** | `EntityField`: field_key = `"vibration_mm_s"`, data_type = `FLOAT`, min = `0`, max = `100` |
| **`status` (RUNNING/DEGRADED)** | `EntityField`: field_key = `"status"`, data_type = `ENUM` |
| **`REPAIR_NOW`, `REDUCE_PROD`** | `ActionDefinition`: action_code = `"REPAIR_NOW"`, title = `"Immediate Repair"` |
| **`max_budget`** | `ConstraintDefinition`: expression = `"predicted_cost <= max_budget"` |
| **`max_downtime_hours`** | `ConstraintDefinition`: expression = `"predicted_downtime <= max_downtime"` |
| **DFA Transition Rule** | `Domain.formal_validation_schema`: States `[START, MACHINE_VALID, ..., ACCEPT]` |
| **Evaluation Response** | `DecisionRecord`: recommended_action = `"C"`, expected_cost = `13739.0` |
| **Maintenance Outcome** | `OutcomeRecord`: actual_downtime_hours = `4.2`, actual_cost = `12500.0` |

---

## 5. How a Second Domain Maps: Personal Finance

### Domain Specification
- **Domain**: Personal Cash Flow & Expense Optimization (`personal_finance`)
- **Entity**: An upcoming obligation or purchase (`Expense` or `Invoice`)
- **Metadata**: vendor = "Landlord / Utility", category = "Housing", due_date = "2026-10-01"

### Dynamic Field Definitions (`EntityField`)
- `amount`: `FLOAT`, min = 0.01 (Invoice amount)
- `current_checking_balance`: `FLOAT`, min = 0.0 (Available liquid balance)
- `upcoming_income_7d`: `FLOAT`, min = 0.0 (Confirmed inflows next 7 days)
- `credit_limit_available`: `FLOAT`, min = 0.0 (Available credit line)
- `penalty_rate_apr`: `FLOAT`, min = 0.0 (Late fee or financing APR)

### Action Vocabulary (`ActionDefinition`)
1. `PAY_FULL`: Settle complete balance immediately from checking.
2. `DEFER_DUE_DATE`: Request 14-day grace extension under payment plan.
3. `SPLIT_INSTALLMENT`: Convert balance into 3 equal monthly installments.
4. `PAY_VIA_CREDIT`: Charge to credit card to preserve cash-flow liquidity.

### Constraints (`ConstraintDefinition`)
1. `LIQUIDITY_BUFFER`: `current_checking_balance - predicted_cash_outflow >= 500` (Maintain minimum cash reserve).
2. `CREDIT_CEILING`: `charge_amount <= credit_limit_available` (Prevent over-limit penalty).
3. `MAX_INTEREST_BURDEN`: `predicted_financing_cost <= 50.0` (Cap finance fees).

### Decision Flow Execution
- **Input**: Expense of ₹45,000 due tomorrow, checking balance = ₹50,000, expected income = ₹20,000 in 5 days.
- **Validation**: Pass syntax check; invoice active, checking verified.
- **Predictions**:
  - `PAY_FULL`: Cost = ₹45,000, Cash Reserve Remaining = ₹5,000 (Violates ₹10,000 safety buffer), Risk = 0.65.
  - `SPLIT_INSTALLMENT`: Cost = ₹15,500 now (including ₹500 fee), Cash Reserve = ₹34,500, Risk = 0.15.
- **Constraints**: `PAY_FULL` flagged as infeasible (Buffer violation).
- **Optimization**: `SPLIT_INSTALLMENT` yields lowest risk-adjusted liquidity impact.
- **Decision**: Recommend `SPLIT_INSTALLMENT`.
- **Outcome**: User splits payment; no overdraft or late fee; recorded in `ExperienceEntry`.

---

## 6. Migration Path: From Hardcoded V1 to Multi-Domain
To evolve the codebase without breaking existing tests, endpoints, or clients:

1. **Step 1: Introduce Domain Metadata Layer in Database**
   Create database schemas for `Domain`, `EntityField`, `ActionDefinition`, and `ConstraintDefinition`. Write a database migration that seeds "Domain Pack 1" (`factory_maintenance`) with the existing fixed schema rules.

2. **Step 2: Wrap Dynamic Evaluators Behind Factory Interfaces**
   Refactor `backend/app/decision_engine.py` into a pluggable engine:
   - Convert hardcoded constraint checks (`check_constraints`) into an expression-evaluator service that consumes `ConstraintDefinition` objects.
   - Keep the existing `evaluate_decision` signature as a convenience wrapper that calls `evaluate_domain_decision(domain="factory_maintenance", ...)`.

3. **Step 3: Generalized Schema Validation**
   Abstract `formal_engine.py` from a fixed DFA class into a schema-driven state machine validator. The factory DFA definition is stored as a domain configuration rather than static Python Enums (`ALLOWED_MACHINE_IDS`).

4. **Step 4: Domain-Aware API Routing**
   Introduce `/api/v2/domains/{domain_id}/decisions/evaluate` which parses dynamic request bodies against `EntityField` definitions. Maintain `/api/decisions/evaluate` as a backward-compatible alias pointing to `domain_id = "factory_maintenance"`.

5. **Step 5: Frontend Dynamic Component Rendering**
   Build dynamic form generators in React driven by `GET /api/v2/domains/{domain_id}/schema`. The existing form fields render dynamically while maintaining identical UI and behavior.

---

## 7. Open Architectural Questions

1. **Multi-Domain ML Model Architecture & Cold Start**
   - *Question*: How are scikit-learn or surrogate ML models trained and hosted for dynamic domains with zero historical data?
   - *Consideration*: Should we support a fallback "Heuristic / Rule Engine" predictor for new domains until `OutcomeRecord` accumulates enough samples (e.g., N ≥ 500) to train a lightweight scikit-learn regressor?

2. **Expression Language Security for Constraints**
   - *Question*: How should user-defined expressions in `ConstraintDefinition` be evaluated safely in Python?
   - *Consideration*: Evaluating raw Python strings via `eval()` is insecure. Should we use an AST-restricted parser (e.g., `simpleeval` or JSONLogic) to prevent code injection?

3. **Formal State Machine Extensibility**
   - *Question*: Is a Deterministic Finite Automaton (DFA) sufficient for all domains, or do some domains require JSON Schema / Pydantic dynamic models?
   - *Consideration*: Sequential request validation benefits from DFAs, while hierarchical records (e.g., nested invoices) require schema trees.

4. **Domain-Specific Optimization Objective Functions**
   - *Question*: Is the current additive cost formula `cost + downtime * rate + risk * factor` generic enough for all domains?
   - *Consideration*: Some domains optimize for non-linear objectives, multi-objective Pareto frontiers, or maximizing reward rather than minimizing penalty.

5. **Dynamic Field Indexing & Storage Strategy**
   - *Question*: Should custom entity fields be stored in relational columns or PostgreSQL `JSONB`?
   - *Consideration*: `JSONB` offers total schema flexibility for user-defined attributes, while hybrid architectures (common fields indexed, custom attributes in JSONB) preserve query performance.

6. **Human-in-the-Loop Multi-Tier Approval Hierarchies**
   - *Question*: How do we handle role-based or multi-signature approval rules per domain (e.g., expenses > ₹10,000 require two managers)?
