# AM&POP — ML Model Card

## Model Overview

AM&POP V1 ships three scikit-learn models that power the Factory Maintenance
Decision Engine. Each model is trained once offline on a synthetic dataset and
loaded at API startup via `joblib`. They are used **inside** the decision loop —
ML predictions are one input to the Dijkstra-based optimizer; they do not make
the final decision on their own.

---

## Model Table

| Target | Algorithm | File | Key Metric |
|---|---|---|---|
| Downtime (hours) | `RandomForestRegressor` | `models/downtime_model.joblib` | R² = 0.953 |
| Cost (USD) | `RandomForestRegressor` | `models/cost_model.joblib` | R² = 0.857 |
| Risk level (0/1/2) | `RandomForestClassifier` | `models/risk_model.joblib` | Accuracy = 0.895 |

### Detailed Metrics

| Target | MAE | RMSE | R² / Accuracy | F1-macro |
|---|---|---|---|---|
| Downtime | 0.307 h | 0.395 h | 0.953 | — |
| Cost | \$696 | \$881 | 0.857 | — |
| Risk | — | — | 0.895 | 0.855 |

---

## Training Data

| Property | Value |
|---|---|
| Origin | Synthetic — physics-inspired formulas + Gaussian noise |
| Rows | 20,000 |
| Split | 80 % train / 20 % test (stratified for risk classifier) |
| Generator | `experiments/generate_dataset.py` |
| Raw file | `data/raw/maintenance_requests.csv` |

Labels were derived from domain equations (e.g., downtime scales with
`tool_wear_min` and `condition_severity`; cost adds a priority multiplier).
No real factory telemetry was used.

---

## Features

| Feature | Type | Range / Values | Description |
|---|---|---|---|
| `temperature_c` | float | 60 – 120 °C | Machine operating temperature |
| `vibration_mm_s` | float | 0.5 – 15 mm/s | Vibration intensity |
| `tool_wear_min` | float | 0 – 480 min | Cumulative tool wear time |
| `condition_severity` | int (ordinal) | 0 NORMAL → 3 CRITICAL | DFA-validated machine state |
| `priority_level` | int (ordinal) | 0 LOW → 3 CRITICAL | Work-order priority |
| `action_REPAIR_NOW` | binary | 0 / 1 | One-hot: action candidate |
| `action_CONTINUE_TEMP` | binary | 0 / 1 | One-hot: action candidate |
| `action_REDUCE_PROD` | binary | 0 / 1 | One-hot: action candidate |
| `action_REALLOCATE` | binary | 0 / 1 | One-hot: action candidate |

Feature schema is persisted in `models/feature_columns.json` to guarantee
training–inference consistency.

---

## Limitations

- **Synthetic data only.** Models have never seen real sensor readings.
  Metrics will degrade on live factory data until retrained.
- **Factory domain only.** The feature schema is specific to maintenance
  work-orders; it is not transferable to other AM&POP domains without
  retraining.
- **Bounded input ranges.** Predictions outside the training ranges
  (e.g., `temperature_c` > 120 °C) are extrapolations with unknown reliability.
- **Static models.** There is no online learning; models must be explicitly
  retrained and redeployed after new data is collected.
- **Risk is ordinal, not probabilistic.** The classifier outputs a class label
  (0/1/2); confidence scores are not surfaced in V1.

---

## Retraining Commands

```bash
# 1. Activate the virtual environment
source .venv/bin/activate

# 2. (Optional) Regenerate synthetic dataset
python experiments/generate_dataset.py

# 3. Retrain all three models — writes *.joblib + metrics.json
python experiments/train_model.py

# 4. Verify new metrics
cat experiments/metrics.json
```

After retraining, restart the API server so it loads the updated `.joblib` files.

---

## File Paths

```
models/
├── downtime_model.joblib   # RandomForestRegressor — downtime prediction
├── cost_model.joblib       # RandomForestRegressor — cost prediction
├── risk_model.joblib       # RandomForestClassifier — risk classification
└── feature_columns.json    # Feature schema + label maps (pinned at train time)
```
