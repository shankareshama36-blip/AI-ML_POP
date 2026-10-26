"""Demo-only authentication for Praxis (no hashing — academic project)."""

from __future__ import annotations

_USERS: dict[str, dict[str, str]] = {
    "tech-1": {"password": "tech123", "role": "technician"},
    "maint-sup": {"password": "maint123", "role": "maintenance_supervisor"},
    "prod-sup": {"password": "prod123", "role": "production_supervisor"},
    "plant-mgr": {"password": "plant123", "role": "plant_manager"},
}


def authenticate(username: str, password: str) -> dict[str, str] | None:
    """Return {username, role} on success, None on failure."""
    user = _USERS.get(username)
    if user and user["password"] == password:
        return {"username": username, "role": user["role"]}
    return None


def get_approval_chain(expected_cost: float, tier1_max: float, tier2_max: float) -> list[str]:
    """Return the ordered list of roles that must approve, given tenant thresholds."""
    if expected_cost < tier1_max:
        return ["maintenance_supervisor"]
    if expected_cost < tier2_max:
        return ["maintenance_supervisor", "production_supervisor"]
    return ["maintenance_supervisor", "production_supervisor", "plant_manager"]
