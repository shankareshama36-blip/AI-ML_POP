# AM&POP System Architecture Overview

## 1. Problem
Organizations face changing situations with limited resources, deadlines, and competing objectives. Existing systems can store data and make predictions, but they struggle to answer: "Given the current situation, what is the best action to take right now?"

## 2. V1 Scope
The V1 implementation is a **Factory Maintenance Decision Engine**. It receives a machine situation, generates possible actions, predicts outcomes, checks constraints, evaluates alternatives, recommends a decision, records why, gets human approval, records the outcome, and uses past outcomes for future decisions.

## 3. Users
- **Primary User:** Plant / Operations Manager (Reviews and approves decisions)
- **Secondary User:** Maintenance Technician (Executes approved decisions)

## 4. Core Decision Loop
INPUT
-> FORMAL INTERPRETATION
-> CURRENT STATE
-> POSSIBLE ACTIONS
-> ML PREDICTIONS
-> CONSTRAINT EVALUATION
-> OPTIMIZATION
-> DECISION
-> APPROVAL / EXECUTION
-> ACTUAL OUTCOME
-> EXPERIENCE MEMORY

### V1 backend decision loop (implemented)

The decision loop begins with deterministic formal validation of a maintenance
request. It accepts the ordered fields `machine_id`,
`maintenance_type`, `priority`, `condition`, and `action`, normalizes each
value, and checks it against an explicit allowed vocabulary.
Unexpected fields are rejected so the request shape remains explicit and
traceable.

The DFA path for a valid request is:

`START -> MACHINE_VALID -> TYPE_VALID -> PRIORITY_VALID -> CONDITION_VALID -> ACTION_VALID -> ACCEPT`

An invalid value transitions directly to `REJECT`. The validator returns the
acceptance result, final state, human-readable reason, failed field (when
applicable), and the state trace. This makes the FLAT mapping observable and
gives later stages a traceable validated input.

After validation, the backend builds a typed operational context from current
machine readings and constraints. It generates the fixed V1 action set
(`REPAIR_NOW`, `CONTINUE_TEMP`, `REDUCE_PROD`, `REALLOCATE`) and produces a
transparent deterministic forecast for downtime, cost, risk, and confidence.
The formulas are baseline placeholders with the same `Prediction` contract a
trained ML model will use.

The constraint engine removes actions that exceed budget, downtime, or deadline
limits, need unavailable people or parts, or would be unsafe for the stated
condition. The optimization engine treats the feasible candidates as a weighted
one-hop graph and uses Dijkstra's algorithm to choose the lowest combined
cost/downtime/risk path. A result remains `PENDING` until a human approves or
rejects it. Only approved decisions can record outcomes, which create an
experience-memory entry with prediction deltas.

## 5. Major Modules
- **Backend API (FastAPI):** Exposes endpoints for the frontend.
- **Formal Engine:** DFA validation of inputs.
- **State Engine:** Converts validated input into a structured operational state. **Implemented.**
- **Actions Engine:** Generates candidate actions. **Implemented.**
- **Prediction Engine:** Produces transparent baseline forecasts; replaceable by ML models. **Implemented.**
- **Constraint Engine:** Filters out infeasible actions based on hard constraints. **Implemented.**
- **Optimization Engine:** Graph search / Dijkstra's algorithm to find the best feasible action. **Implemented.**
- **Decision Engine:** Produces a structured decision with evidence. **Implemented.**
- **Memory Engine:** Stores outcomes and retrieves past experiences in-process. **Implemented (adapter).**
- **Governance Engine:** Manages approvals and audit trails. **Implemented.**
- **Frontend (React):** Dashboard for managers to view situations and approve decisions.

## 6. Data Flow
Input (Machine Data) -> DFA Validation -> State Representation -> Action Generation -> Prediction -> Constraint Checking -> Optimization -> Decision -> Approval -> Execution -> Outcome -> Experience Memory.

## 7. Academic Mapping
- **FLAT:** Deterministic Finite Automaton (DFA) for input validation.
- **AI/ML:** Regression / Classification for outcome prediction.
- **DAA:** Graph Search / Optimization (Dijkstra's Algorithm).

## 8. V1 Boundaries
- No real factory hardware or SCADA/ERP integrations.
- No multi-agent swarm.
- No custom LLM.
- Single industry domain (Factory Maintenance).

## 9. Future Scope
- Multi-industry deployment (Logistics, Supply Chain, Healthcare, Finance).
- Autonomous Decision OS.
- Operational Simulation Engine.
- Decision Intelligence Network.
- Offline synchronization.

## 10. Technology Stack
- **Backend:** Python, FastAPI, Pydantic
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Database:** In-memory V1 adapter; PostgreSQL is the planned deployment adapter
- **ML/Data:** scikit-learn, pandas, numpy
- **Optimization:** Custom Python implementation
- **DevOps:** Docker, Docker Compose, GitHub Actions
- **Testing:** pytest

## 11. Local Development Architecture
- **MacBook Pro (M5, 16GB):** Primary development machine. Runs Docker, VS Code, FastAPI, PostgreSQL, React, ML training.
- **Lenovo Slim 3i:** Secondary test/experiment machine. Used for dataset generation, ML experiments, benchmarking, API testing, and second-browser/user testing.
- **GitHub:** Remote source of truth for project history and collaboration.

## 12. GitHub Development Workflow
- **One Feature at a Time.**
- Workflow: Define feature -> Implement -> Write tests -> Run tests -> Integrate -> Review -> Commit -> Push -> Update docs.
- Each feature must have code, tests, documentation, and a commit.
- Do not push half-working features as finished.
