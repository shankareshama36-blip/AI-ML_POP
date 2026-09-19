"""Feature building for the ML prediction engine.

Must produce the exact same feature layout used during training.
"""
CONDITION_MAP = {"NORMAL": 0, "WARN": 1, "ALERT": 2, "CRITICAL": 3}
PRIORITY_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
ACTIONS = ["REPAIR_NOW", "CONTINUE_TEMP", "REDUCE_PROD", "REALLOCATE"]


def build_feature_dict(
    temperature_c: float,
    vibration_mm_s: float,
    tool_wear_min: float,
    condition: str,
    priority: str,
    action_type: str,
) -> dict:
    row = {
        "temperature_c": float(temperature_c),
        "vibration_mm_s": float(vibration_mm_s),
        "tool_wear_min": float(tool_wear_min),
        "condition_severity": CONDITION_MAP.get(condition, 0),
        "priority_level": PRIORITY_MAP.get(priority, 1),
    }
    for action in ACTIONS:
        row[f"action_{action}"] = 1 if action_type == action else 0
    return row
