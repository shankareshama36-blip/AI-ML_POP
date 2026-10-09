# AM&POP — Autonomous Maintenance & Planning Optimization Platform

> **AI can act. AM&POP decides.**

---

## What Is AM&POP?

AM&POP is a **decision intelligence system** — a platform that combines formal
verification, machine learning, constraint satisfaction, and graph optimization
to produce **explainable, auditable decisions**, not just predictions. Where a
typical AI model answers "what will happen?", AM&POP answers "what should we
do, and why, and who must approve it?"

---

## The Problem

Prediction alone is insufficient. A model that forecasts 4 hours of downtime
provides no guidance on which of the four available maintenance actions to
choose, whether operational constraints allow it, what it will cost, or whether
a human must approve the action before execution. AM&POP closes that gap.

---

## Core Decision Loop

```
INPUT → DFA → STATE → ACTIONS → ML → CONSTRAINTS → DIJKSTRA → DECISION → APPROVAL → OUTCOME → MEMORY
```

| Stage | What Happens |
|---|---|
| **INPUT** | Maintenance request arrives (sensor readings + priority) |
| **DFA** | Formal state machine validates the request is well-formed |
| **STATE** | Machine condition classified (NORMAL / WARN / ALERT / CRITICAL) |
| **ACTIONS** | Candidate actions enumerated (REPAIR_NOW, REDUCE_PROD, …) |
| **ML** | RandomForest predicts downtime, cost, and risk per action |
| **CONSTRAINTS** | Budget cap, shift limit, and priority floor applied |
| **DIJKSTRA** | Shortest-path optimizer selects the lowest-cost feasible action |
| **DECISION** | Chosen action packaged with full audit trail |
| **APPROVAL** | Human-in-the-loop gate — manager APPROVED / REJECTED |
| **OUTCOME** | Actual results recorded against predictions |
| **MEMORY** | Experience stored for future learning and retraining |

---

## V1 — Factory Maintenance Decision Engine

**Users:** Maintenance managers and on-floor technicians at discrete
manufacturing facilities.

**What it does:**

- Accepts a maintenance work-order (machine ID, sensor telemetry, priority).
- Validates the request through a Deterministic Finite Automaton.
- Scores every candidate action with three ML models (downtime, cost, risk).
- Applies operational constraints (budget, shift hours, priority rules).
- Runs Dijkstra's algorithm to find the optimal feasible action.
- Requires a human manager to approve or reject before anything executes.
- Records the real outcome and stores the experience for future use.

---

## Academic Mapping

| Module | Course Area | Implementation |
|---|---|---|
| FLAT (Formal Languages & Automata Theory) | DFA | `backend/app/formal_engine.py` — real 5-state DFA |
| AI / ML | RandomForest | `models/*.joblib` — three trained scikit-learn models |
| DAA (Design & Analysis of Algorithms) | Dijkstra | `backend/app/decision_engine.py` — real weighted graph optimizer |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Python 3.14, FastAPI, Uvicorn |
| **ML** | scikit-learn (RandomForestRegressor / Classifier), joblib, NumPy |
| **Frontend** | Vite 6, React 19, TypeScript |
| **Testing** | pytest, pytest-asyncio, httpx |
| **Linting** | Ruff |
| **Security** | slowapi (rate limiting), security middleware headers |

---

## Repository Layout

```
AI-ML_POP/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI application + 7 endpoints
│       ├── formal_engine.py     # DFA implementation
│       ├── decision_engine.py   # Dijkstra optimizer
│       ├── models.py            # Pydantic schemas
│       └── prediction/          # ML inference wrappers
├── frontend/
│   └── src/                     # Vite + React + TypeScript UI
├── models/
│   ├── downtime_model.joblib
│   ├── cost_model.joblib
│   ├── risk_model.joblib
│   └── feature_columns.json
├── experiments/
│   ├── generate_dataset.py      # Synthetic data generator
│   ├── train_model.py           # Model trainer
│   └── metrics.json             # Latest evaluation metrics
├── data/raw/maintenance_requests.csv
├── tests/                       # 25 passing tests
├── docs/
│   ├── architecture/
│   ├── decisions/
│   └── ml/model-card.md
└── pyproject.toml
```

---

## Local Setup

**Terminal 1 — Backend**

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn backend.app.main:app --reload --port 8000
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

API docs available at `http://localhost:8000/docs`.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/validate/maintenance-request` | DFA validation only |
| `POST` | `/decisions/evaluate` | Run full decision loop, create audit record |
| `GET` | `/decisions/{decision_id}` | Retrieve decision + audit trail |
| `POST` | `/decisions/{decision_id}/approval` | Manager APPROVED / REJECTED |
| `POST` | `/decisions/{decision_id}/outcome` | Record real execution results |
| `GET` | `/experiences` | List completed decisions for learning |

---

## Testing

```bash
# Activate venv first
source .venv/bin/activate

# Run all tests (25 passing)
pytest

# Lint
ruff check .
```

---

## Status

**Implemented**
- DFA formal validation (5-state machine)
- Three trained ML models (downtime R²=0.953, cost R²=0.857, risk acc=0.895)
- Dijkstra optimizer over action-cost graph
- Human-in-the-loop approval gate
- Outcome recording + experience memory
- Full audit trail on every decision
- React + TypeScript frontend
- Rate limiting and security middleware
- 25 automated tests

**Planned**
- Real sensor integration (OPC-UA / MQTT ingest)
- Online retraining from accumulated experience
- Multi-domain expansion (supply chain, energy, healthcare)
- Role-based access control
- Prometheus metrics and alerting

---

## Documentation

| Document | Path |
|---|---|
| System Architecture | [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md) |
| Decision Contract | [`docs/decisions/decision-contract.md`](docs/decisions/decision-contract.md) |
| ML Model Card | [`docs/ml/model-card.md`](docs/ml/model-card.md) |
| Multi-Domain Model | [`docs/architecture/multi-domain-model.md`](docs/architecture/multi-domain-model.md) |

---

> **AI can act. AM&POP decides.**
