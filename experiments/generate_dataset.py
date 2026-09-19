"""Generate a synthetic-but-realistic maintenance training dataset.

Features model machine condition and operational context.
Targets use physics-inspired formulas plus noise, so the model
learns patterns rather than memorizing one formula.
"""
from pathlib import Path

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
N = 20000

CONDITIONS = ["NORMAL", "WARN", "ALERT", "CRITICAL"]
PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
ACTIONS = ["REPAIR_NOW", "CONTINUE_TEMP", "REDUCE_PROD", "REALLOCATE"]

CONDITION_SEVERITY = {"NORMAL": 0, "WARN": 1, "ALERT": 2, "CRITICAL": 3}
PRIORITY_MULT = {"LOW": 0.8, "MEDIUM": 1.0, "HIGH": 1.3, "CRITICAL": 1.7}

ACTION_BASE = {
    "REPAIR_NOW":     (2.5, 1200, 0.10),
    "CONTINUE_TEMP":  (0.3,  150, 0.35),
    "REDUCE_PROD":    (1.5,  450, 0.20),
    "REALLOCATE":     (1.8,  800, 0.15),
}


def generate():
    rows = []
    for _ in range(N):
        condition = RNG.choice(CONDITIONS, p=[0.55, 0.25, 0.15, 0.05])
        priority = RNG.choice(PRIORITIES, p=[0.35, 0.35, 0.22, 0.08])
        action = RNG.choice(ACTIONS, p=[0.25, 0.30, 0.25, 0.20])

        # realistic machine sensor readings
        base_temp = 70 + CONDITION_SEVERITY[condition] * 6
        temperature_c = float(np.clip(base_temp + RNG.normal(0, 5), 55, 110))

        base_vib = 3 + CONDITION_SEVERITY[condition] * 1.2
        vibration_mm_s = float(np.clip(base_vib + RNG.normal(0, 0.6), 0.5, 12))

        tool_wear_min = float(np.clip(RNG.gamma(2.0, 40), 0, 260))

        # physics-inspired targets with noise
        sev = CONDITION_SEVERITY[condition]
        pri = PRIORITY_MULT[priority]
        base_dt, base_cost, base_risk = ACTION_BASE[action]

        # downtime: base + severity effect + nonlinear temp effect + noise
        downtime = base_dt + sev * 1.4
        downtime += (temperature_c - 75) * 0.04
        downtime += max(0.0, vibration_mm_s - 5) * 0.4
        downtime = max(0.1, downtime + RNG.normal(0, 0.4))

        # cost: downtime * hourly cost + parts + noise
        cost = base_cost * pri + downtime * 950
        cost += sev * 400
        cost = max(50, cost + RNG.normal(0, 800))

        # risk: probability of failure, higher when severe + high temp + high vib
        risk = base_risk + sev * 0.10
        risk += max(0.0, (temperature_c - 85) * 0.015)
        risk += max(0.0, (vibration_mm_s - 6) * 0.03)
        risk = float(np.clip(risk + RNG.normal(0, 0.05), 0.01, 0.99))

        rows.append({
            "temperature_c": round(temperature_c, 2),
            "vibration_mm_s": round(vibration_mm_s, 3),
            "tool_wear_min": round(tool_wear_min, 1),
            "condition": condition,
            "priority": priority,
            "action_type": action,
            "downtime_hours": round(downtime, 3),
            "cost_inr": round(cost, 2),
            "risk_score": round(risk, 4),
        })

    return pd.DataFrame(rows)


if __name__ == "__main__":
    df = generate()
    out = Path("data/raw/maintenance_requests.csv")
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"Wrote {len(df)} rows to {out}")
    print(df.describe())
