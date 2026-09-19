"""Real scikit-learn prediction engine for AM&POP.

Loads three trained models (downtime, cost, risk) and exposes a single
predict() method that returns (downtime_hours, cost, risk_score, confidence).
"""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from .features import build_feature_dict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODELS_DIR = PROJECT_ROOT / "models"


class PredictionEngine:
    def __init__(self, models_dir: Path = MODELS_DIR) -> None:
        self.downtime_model = joblib.load(models_dir / "downtime_model.joblib")
        self.cost_model = joblib.load(models_dir / "cost_model.joblib")
        self.risk_model = joblib.load(models_dir / "risk_model.joblib")

        with open(models_dir / "feature_columns.json") as f:
            spec = json.load(f)
        self.feature_columns: list[str] = spec["feature_columns"]
        self.risk_midpoints: dict = {
            int(k): float(v) for k, v in spec["risk_midpoints"].items()
        }

    def _to_dataframe(self, row: dict) -> pd.DataFrame:
        """Build a single-row DataFrame with the exact training column names."""
        return pd.DataFrame([row], columns=self.feature_columns)

    def predict(
        self,
        temperature_c: float,
        vibration_mm_s: float,
        tool_wear_min: float,
        condition: str,
        priority: str,
        action_type: str,
    ) -> tuple[float, float, float, float]:
        row = build_feature_dict(
            temperature_c=temperature_c,
            vibration_mm_s=vibration_mm_s,
            tool_wear_min=tool_wear_min,
            condition=condition,
            priority=priority,
            action_type=action_type,
        )
        X = self._to_dataframe(row)

        downtime = float(self.downtime_model.predict(X)[0])
        cost = float(self.cost_model.predict(X)[0])

        proba = self.risk_model.predict_proba(X)[0]
        risk_class = int(np.argmax(proba))
        confidence = float(np.max(proba))
        risk_score = self.risk_midpoints.get(risk_class, 0.4)

        return (
            max(0.0, downtime),
            max(0.0, cost),
            max(0.0, min(1.0, risk_score)),
            max(0.0, min(1.0, confidence)),
        )


_engine: PredictionEngine | None = None


def get_engine() -> PredictionEngine:
    """Lazy singleton. Loads models on first call."""
    global _engine
    if _engine is None:
        _engine = PredictionEngine()
    return _engine
