# AI-ML_POP

AM&POP is a factory-maintenance decision-support prototype. It uses explicit
formal validation, deterministic baseline forecasts, hard-constraint checking,
Dijkstra-based optimization, and human approval before outcomes are recorded.

## Implemented V1 backend loop

`request -> DFA validation -> state -> actions -> forecasts -> constraints -> optimization -> decision -> approval -> outcome -> experience memory`

The API is intentionally traceable: an evaluated decision retains every
intermediate result, so an operator can understand the recommendation rather
than receiving a black-box answer.

### Start locally

```bash
python3 -m pip install -e '.[dev]'
uvicorn backend.app.main:app --reload
```

Interactive API documentation is then available at `http://127.0.0.1:8000/docs`.

### Main endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `POST` | `/validate/maintenance-request` | Run DFA validation only |
| `POST` | `/decisions/evaluate` | Evaluate and create a pending decision |
| `GET` | `/decisions/{decision_id}` | Retrieve the full decision audit trail |
| `POST` | `/decisions/{decision_id}/approval` | Approve or reject a pending decision |
| `POST` | `/decisions/{decision_id}/outcome` | Record an approved decision's outcome |
| `GET` | `/experiences` | Retrieve completed-decision memory |

### Example decision evaluation

```json
{
  "maintenance_request": {
    "machine_id": "M-101",
    "maintenance_type": "PREVENTIVE",
    "priority": "HIGH",
    "condition": "WARN",
    "action": "INSPECT"
  },
  "machine_state": {
    "temperature_c": 81,
    "vibration_mm_s": 5.5,
    "operating_hours": 1250,
    "status": "DEGRADED"
  },
  "operational_constraints": {
    "max_budget": 10000,
    "max_downtime_hours": 12,
    "deadline_hours": 16,
    "technicians_available": true,
    "spare_parts_available": true
  }
}
```

The current repository is an in-memory V1 persistence adapter. It preserves
records while the API process is running; a PostgreSQL adapter is the next
deployment-oriented replacement and does not require changing the API contract.
