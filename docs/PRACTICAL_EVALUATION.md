# Praxis — Practical Academic Evaluation & Proof Guide

> **Target Audience:** Academic Examiners, Evaluators, and Technical Reviewers.  
> **Objective:** Practical, terminal-executable proof of **FLAT** (Formal Languages & Automata Theory), **DAA** (Design & Analysis of Algorithms), and **AI-ML** (Machine Learning) in the Praxis Autonomous Decision Engine.

---

## Quick Reference: Algorithm Implementation Map

| Academic Subject | Mathematical Model | Source File | Endpoint | Verification Metric / Proof |
|---|---|---|---|---|
| **FLAT** | 5-tuple DFA $M = (Q, \Sigma, \delta, q_0, F)$ | [`backend/app/formal_engine.py`](file:///Users/shankareshama/Desktop/AI-ML_POP/backend/app/formal_engine.py) | `POST /validate/maintenance-request` | State transition trace: `["START", "MACHINE_VALID", "TYPE_VALID", "REJECT"]` |
| **DAA** | Dijkstra Shortest Path ($O((V + E) \log V)$) | [`backend/app/decision_engine.py`](file:///Users/shankareshama/Desktop/AI-ML_POP/backend/app/decision_engine.py) | `POST /decisions/evaluate` | Graph scores & shortest path: `best_action_id: "B"` ($Score: 7749.88$) |
| **AI-ML** | Random Forest (Regression + Classification) | [`backend/app/prediction/model.py`](file:///Users/shankareshama/Desktop/AI-ML_POP/backend/app/prediction/model.py) | `POST /decisions/evaluate` | Multi-target predictions: Downtime ($1.86\,\text{hrs}$), Cost ($\text{₹}1,889.88$), Confidence ($88.1\%$), $R^2 = 0.953$ |

Interactive API Documentation is running live at: **`http://127.0.0.1:8000/docs`** (Swagger UI).

---

## 1. FLAT (Formal Languages & Automata Theory) — DFA Proof

### Mathematical Foundation
Praxis models maintenance request validation as a Deterministic Finite Automaton (DFA):
$$M = (Q, \Sigma, \delta, q_0, F)$$
- **State Set ($Q$):** `START`, `MACHINE_VALID`, `TYPE_VALID`, `PRIORITY_VALID`, `CONDITION_VALID`, `ACTION_VALID`, `ACCEPT`, `REJECT`
- **Alphabet ($\Sigma$):** Bounded tokens across `MACHINE_ID`, `MAINTENANCE_TYPE`, `PRIORITY`, `CONDITION`, `ACTION`, and `END_OF_REQUEST`
- **Transition Function ($\delta$):** $\delta: Q \times \Sigma \rightarrow Q$ (Strict deterministic $O(1)$ transitions)
- **Start State ($q_0$):** `START`
- **Accepting State ($F$):** `{ACCEPT}`

### Terminal Execution (`curl`)
Execute this command in your terminal to submit a request with an invalid priority (`"INVALID_PRIORITY"`):

```bash
curl -s -X POST "http://127.0.0.1:8000/validate/maintenance-request" \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": "M-101",
    "maintenance_type": "PREVENTIVE",
    "priority": "INVALID_PRIORITY",
    "condition": "NORMAL",
    "action": "INSPECT"
  }' | jq .
```

### Expected JSON Output
```json
{
  "accepted": false,
  "final_state": "REJECT",
  "reason": "Invalid priority",
  "failed_at_position": "priority",
  "trace": [
    "START",
    "MACHINE_VALID",
    "TYPE_VALID",
    "REJECT"
  ]
}
```

### Proof Walkthrough
1. **$q_0 = \text{START}$**: The engine reads `"M-101"`. Since `"M-101" \in \text{ALLOWED\_MACHINE\_IDS}$, $\delta(\text{START}, \text{MACHINE\_ID}) = \text{MACHINE\_VALID}$.
2. **$\text{MACHINE\_VALID}$**: The engine reads `"PREVENTIVE"`. Since `"PREVENTIVE" \in \text{ALLOWED\_MAINTENANCE\_TYPES}$, $\delta(\text{MACHINE\_VALID}, \text{MAINTENANCE\_TYPE}) = \text{TYPE\_VALID}$.
3. **$\text{TYPE\_VALID}$**: The engine reads `"INVALID\_PRIORITY"`. Since `"INVALID\_PRIORITY" \notin \text{ALLOWED\_PRIORITIES}$, $\delta(\text{TYPE\_VALID}, \text{INVALID}) = \text{REJECT}$.
4. **Early Exit Guarantee**: The automaton terminates immediately without reading the remaining fields (`"NORMAL"`, `"INSPECT"`), preventing unsafe unvalidated states from entering downstream layers.

---

## 2. DAA (Design & Analysis of Algorithms) — Dijkstra Optimization Proof

### Mathematical Foundation
Praxis uses Dijkstra's single-source shortest path algorithm over a weighted decision graph to select the optimal feasible operational action.

- **Graph Structure:** $G = (V, E)$, where $V = \{\text{SOURCE}\} \cup \{\text{Feasible Actions: } A, B, C, D\}$
- **Objective Weight Function ($w$):**
  $$w(\text{SOURCE}, \text{Action}_i) = \text{Cost}_i + (\text{Downtime}_i \times \text{DowntimeRate}) + (\text{RiskScore}_i \times \text{RiskCostFactor})$$
- **Priority Queue Implementation:** Min-heap (`heapq`) achieving $O((V + E) \log V)$ time complexity.

### Terminal Execution (`curl`)

#### Step 2.1: Obtain JWT Bearer Token (Demo Auth)
```bash
TOKEN=$(curl -s -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "tech@praxis.local", "password": "Tech@12345!"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)
```

#### Step 2.2: Execute Decision Evaluation
```bash
curl -s -X POST "http://127.0.0.1:8000/decisions/evaluate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "maintenance_request": {
      "machine_id": "M-101",
      "maintenance_type": "PREVENTIVE",
      "priority": "HIGH",
      "condition": "WARN",
      "action": "INSPECT"
    },
    "machine_state": {
      "temperature_c": 81.0,
      "vibration_mm_s": 5.5,
      "operating_hours": 1250,
      "status": "DEGRADED"
    },
    "operational_constraints": {
      "max_budget": 10000.0,
      "max_downtime_hours": 12.0,
      "deadline_hours": 16.0,
      "technicians_available": true,
      "spare_parts_available": true,
      "downtime_cost_per_hour": 1000.0,
      "risk_cost_factor": 10000.0
    }
  }' | jq '{optimization: .optimization, decision: .decision}'
```

### Expected JSON Output (Highlighting DAA Optimization)
```json
{
  "optimization": {
    "feasible_actions": [
      "A",
      "B",
      "C",
      "D"
    ],
    "scores": {
      "A": 11826.81,
      "B": 7749.88,
      "C": 11584.22,
      "D": 12107.32
    },
    "best_action_id": "B"
  },
  "decision": {
    "recommended_action_id": "B",
    "expected_cost": 1889.88,
    "expected_downtime": 1.86,
    "expected_risk": "MEDIUM",
    "confidence": 0.881,
    "reason": "CONTINUE_TEMP is the lowest-scoring feasible action (7749.88) after cost, downtime, risk, and hard constraints were evaluated."
  }
}
```

### Proof Walkthrough
1. **Candidate Actions:** Four viable industrial actions are enumerated:
   - Action A: `REPAIR_NOW`
   - Action B: `CONTINUE_TEMP`
   - Action C: `REDUCE_PROD`
   - Action D: `REALLOCATE`
2. **Weight Calculation for Action B:**
   - Predicted Cost = $\text{₹}1,889.88$
   - Predicted Downtime = $1.86\,\text{hrs} \times \text{₹}1,000/\text{hr} = \text{₹}1,860.00$
   - Predicted Risk = $0.40 \times 10,000 = \text{₹}4,000.00$
   - **Composite Edge Weight:** $1,889.88 + 1,860.00 + 4,000.00 = 7,749.88$
3. **Shortest Path Determination:**
   $$7,749.88 < 11,584.22 < 11,826.81 < 12,107.32$$
   Dijkstra's min-heap selects **Action B** as the global minimum cost path.

---

## 3. AI-ML (Machine Learning) — Random Forest Proof

### Mathematical Foundation
Praxis does not hardcode predictions. It executes a trained multi-target ensemble of 100 Scikit-Learn decision trees:
- **Downtime Regressor (`downtime_model.joblib`):** $f_{\text{downtime}}(\mathbf{x}) \in \mathbb{R}^+$ ($R^2 = 0.953$)
- **Cost Regressor (`cost_model.joblib`):** $f_{\text{cost}}(\mathbf{x}) \in \mathbb{R}^+$ ($R^2 = 0.948$)
- **Risk Classifier (`risk_model.joblib`):** $P(y = c \mid \mathbf{x}) = \frac{1}{T} \sum_{t=1}^T P_t(y = c \mid \mathbf{x})$ ($89.5\%$ Accuracy)

### Terminal Execution (`curl`)
Filter the `/decisions/evaluate` response specifically for the ML predictions array:

```bash
curl -s -X POST "http://127.0.0.1:8000/decisions/evaluate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "maintenance_request": {
      "machine_id": "M-101",
      "maintenance_type": "PREVENTIVE",
      "priority": "HIGH",
      "condition": "WARN",
      "action": "INSPECT"
    },
    "machine_state": {
      "temperature_c": 81.0,
      "vibration_mm_s": 5.5,
      "operating_hours": 1250,
      "status": "DEGRADED"
    },
    "operational_constraints": {
      "max_budget": 10000.0,
      "max_downtime_hours": 12.0,
      "deadline_hours": 16.0,
      "technicians_available": true,
      "spare_parts_available": true,
      "downtime_cost_per_hour": 1000.0,
      "risk_cost_factor": 10000.0
    }
  }' | jq '.predictions'
```

### Expected JSON Output (Highlighting ML Predictions)
```json
[
  {
    "action_id": "A",
    "predicted_downtime_hours": 4.37,
    "predicted_cost": 5956.81,
    "predicted_risk_score": 0.15,
    "confidence": 0.664
  },
  {
    "action_id": "B",
    "predicted_downtime_hours": 1.86,
    "predicted_cost": 1889.88,
    "predicted_risk_score": 0.4,
    "confidence": 0.881
  },
  {
    "action_id": "C",
    "predicted_downtime_hours": 3.35,
    "predicted_cost": 4234.22,
    "predicted_risk_score": 0.4,
    "confidence": 0.644
  },
  {
    "action_id": "D",
    "predicted_downtime_hours": 3.51,
    "predicted_cost": 4597.32,
    "predicted_risk_score": 0.4,
    "confidence": 0.567
  }
]
```

### Proof Walkthrough
- Continuous outputs (`predicted_downtime_hours: 1.86`, `predicted_cost: 1889.88`) are directly generated by regression trees evaluated against normalized telemetry ($T=81^\circ\text{C}$, $V=5.5\,\text{mm/s}$).
- Confidence score ($0.881$) represents tree consensus across the 100-estimator ensemble $\max_c P(y=c \mid \mathbf{x})$.

---

## 4. Swagger UI (OpenAPI) Interactive Verification

For evaluators who prefer browser-based inspection:

1. Open your browser and navigate to: **`http://127.0.0.1:8000/docs`**
2. Locate **`POST /validate/maintenance-request`**:
   - Click **"Try it out"**.
   - Note that the request body is **pre-filled with the academic DFA rejection test case**:
     ```json
     {
       "machine_id": "M-101",
       "maintenance_type": "PREVENTIVE",
       "priority": "INVALID_PRIORITY",
       "condition": "NORMAL",
       "action": "INSPECT"
     }
     ```
   - Click **"Execute"**.
   - Inspect the live response: Status code `200 OK` with `trace: ["START", "MACHINE_VALID", "TYPE_VALID", "REJECT"]`.
3. Locate **`POST /decisions/evaluate`**:
   - Click **"Try it out"**.
   - The body is pre-populated with a valid multi-sensor payload.
   - Click **"Execute"** to see Dijkstra optimization scores and Random Forest predictions.

---

## 5. Verification Checklist for Evaluator

- [x] **FLAT:** Explicit 5-tuple DFA with deterministic state transition function $\delta$ in [`backend/app/formal_engine.py`](file:///Users/shankareshama/Desktop/AI-ML_POP/backend/app/formal_engine.py).
- [x] **DAA:** Single-source shortest path Dijkstra optimizer with min-heap priority queue in [`backend/app/decision_engine.py`](file:///Users/shankareshama/Desktop/AI-ML_POP/backend/app/decision_engine.py).
- [x] **AI-ML:** Real Scikit-Learn Random Forest Regressor & Classifier models in [`backend/app/prediction/model.py`](file:///Users/shankareshama/Desktop/AI-ML_POP/backend/app/prediction/model.py).
- [x] **Audit Trail:** Immutable end-to-end decision lifecycle trace verified by unit tests in [`tests/`](file:///Users/shankareshama/Desktop/AI-ML_POP/tests/).
