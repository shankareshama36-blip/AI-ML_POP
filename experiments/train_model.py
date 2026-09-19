"""Train real scikit-learn models for AM&POP prediction engine.

Trains three models on data/raw/maintenance_requests.csv:
- downtime_model: predicts downtime_hours (regression)
- cost_model: predicts cost_inr (regression)
- risk_model: predicts risk_score as class probabilities (classification)

Saves models to models/ and metrics to experiments/metrics.json.
"""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split

CONDITION_MAP = {"NORMAL": 0, "WARN": 1, "ALERT": 2, "CRITICAL": 3}
PRIORITY_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
ACTIONS = ["REPAIR_NOW", "CONTINUE_TEMP", "REDUCE_PROD", "REALLOCATE"]

RISK_BINS = [0.0, 0.25, 0.55, 1.01]
RISK_LABELS = [0, 1, 2]  # low, medium, high
RISK_MIDPOINTS = {0: 0.15, 1: 0.40, 2: 0.75}


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    X = pd.DataFrame()
    X["temperature_c"] = df["temperature_c"]
    X["vibration_mm_s"] = df["vibration_mm_s"]
    X["tool_wear_min"] = df["tool_wear_min"]
    X["condition_severity"] = df["condition"].map(CONDITION_MAP)
    X["priority_level"] = df["priority"].map(PRIORITY_MAP)
    for action in ACTIONS:
        X[f"action_{action}"] = (df["action_type"] == action).astype(int)
    return X


def main():
    data_path = Path("data/raw/maintenance_requests.csv")
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} rows")

    X = build_features(df)
    feature_columns = list(X.columns)

    y_downtime = df["downtime_hours"].values
    y_cost = df["cost_inr"].values
    y_risk_class = pd.cut(
        df["risk_score"], bins=RISK_BINS, labels=RISK_LABELS
    ).astype(int).values

    # single split shared across all three models
    idx_train, idx_test = train_test_split(
        np.arange(len(df)), test_size=0.2, random_state=42
    )
    X_train, X_test = X.iloc[idx_train], X.iloc[idx_test]

    metrics = {}

    # ---------- Downtime regressor ----------
    print("\nTraining downtime model...")
    dt_model = RandomForestRegressor(
        n_estimators=200, max_depth=12, random_state=42, n_jobs=-1
    )
    dt_model.fit(X_train, y_downtime[idx_train])
    dt_pred = dt_model.predict(X_test)
    dt_mae = mean_absolute_error(y_downtime[idx_test], dt_pred)
    dt_rmse = float(np.sqrt(mean_squared_error(y_downtime[idx_test], dt_pred)))
    dt_r2 = r2_score(y_downtime[idx_test], dt_pred)
    print(f"  MAE={dt_mae:.3f}  RMSE={dt_rmse:.3f}  R2={dt_r2:.3f}")
    metrics["downtime"] = {"mae": dt_mae, "rmse": dt_rmse, "r2": dt_r2}

    # ---------- Cost regressor ----------
    print("\nTraining cost model...")
    cost_model = RandomForestRegressor(
        n_estimators=200, max_depth=12, random_state=42, n_jobs=-1
    )
    cost_model.fit(X_train, y_cost[idx_train])
    cost_pred = cost_model.predict(X_test)
    cost_mae = mean_absolute_error(y_cost[idx_test], cost_pred)
    cost_rmse = float(np.sqrt(mean_squared_error(y_cost[idx_test], cost_pred)))
    cost_r2 = r2_score(y_cost[idx_test], cost_pred)
    print(f"  MAE={cost_mae:.2f}  RMSE={cost_rmse:.2f}  R2={cost_r2:.3f}")
    metrics["cost"] = {"mae": cost_mae, "rmse": cost_rmse, "r2": cost_r2}

    # ---------- Risk classifier ----------
    print("\nTraining risk model...")
    risk_model = RandomForestClassifier(
        n_estimators=200, max_depth=12, random_state=42, n_jobs=-1
    )
    risk_model.fit(X_train, y_risk_class[idx_train])
    risk_pred = risk_model.predict(X_test)
    risk_acc = accuracy_score(y_risk_class[idx_test], risk_pred)
    risk_f1 = f1_score(y_risk_class[idx_test], risk_pred, average="macro")
    print(f"  Accuracy={risk_acc:.3f}  F1_macro={risk_f1:.3f}")
    metrics["risk"] = {"accuracy": risk_acc, "f1_macro": risk_f1}

    # ---------- Save artifacts ----------
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    joblib.dump(dt_model, models_dir / "downtime_model.joblib")
    joblib.dump(cost_model, models_dir / "cost_model.joblib")
    joblib.dump(risk_model, models_dir / "risk_model.joblib")

    with open(models_dir / "feature_columns.json", "w") as f:
        json.dump(
            {
                "feature_columns": feature_columns,
                "actions": ACTIONS,
                "condition_map": CONDITION_MAP,
                "priority_map": PRIORITY_MAP,
                "risk_midpoints": RISK_MIDPOINTS,
            },
            f,
            indent=2,
        )

    metrics_path = Path("experiments/metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nSaved 3 models to {models_dir}/")
    print("Saved feature spec and metrics.")
    print(f"\nMetrics summary: {json.dumps(metrics, indent=2)}")


if __name__ == "__main__":
    main()
