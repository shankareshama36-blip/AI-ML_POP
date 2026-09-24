import type { DecisionInput } from "./api";

export const ALLOWED_MACHINE_IDS = [
  "M-101",
  "M-102",
  "M-201",
  "M-220",
  "M-303",
  "M-404",
  "M-510",
] as const;

export const ALLOWED_MAINTENANCE_TYPES = [
  "PREVENTIVE",
  "CORRECTIVE",
  "INSPECTION",
  "PREDICTIVE",
] as const;

export const ALLOWED_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export const ALLOWED_CONDITIONS = [
  "NORMAL",
  "WARN",
  "ALERT",
  "CRITICAL",
] as const;

export const ALLOWED_ACTIONS = [
  "INSPECT",
  "REPAIR",
  "REPLACE",
  "SHUTDOWN",
  "PAUSE_PRODUCTION",
] as const;

export const ALLOWED_STATUSES = [
  "RUNNING",
  "DEGRADED",
  "OFFLINE",
] as const;

export function validateDecisionInput(input: DecisionInput): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Maintenance Request
  if (!ALLOWED_MACHINE_IDS.includes(input.maintenance_request.machine_id as any)) {
    errors["machine_id"] = `Machine ID must be one of: ${ALLOWED_MACHINE_IDS.join(", ")}`;
  }
  if (
    !ALLOWED_MAINTENANCE_TYPES.includes(
      input.maintenance_request.maintenance_type as any
    )
  ) {
    errors["maintenance_type"] = `Maintenance type must be one of: ${ALLOWED_MAINTENANCE_TYPES.join(", ")}`;
  }
  if (!ALLOWED_PRIORITIES.includes(input.maintenance_request.priority as any)) {
    errors["priority"] = `Priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}`;
  }
  if (!ALLOWED_CONDITIONS.includes(input.maintenance_request.condition as any)) {
    errors["condition"] = `Condition must be one of: ${ALLOWED_CONDITIONS.join(", ")}`;
  }
  if (!ALLOWED_ACTIONS.includes(input.maintenance_request.action as any)) {
    errors["action"] = `Action must be one of: ${ALLOWED_ACTIONS.join(", ")}`;
  }

  // Machine State
  const temp = input.machine_state.temperature_c;
  if (typeof temp !== "number" || Number.isNaN(temp) || temp < -20 || temp > 200) {
    errors["temperature_c"] = "Temperature must be between -20 and 200";
  }

  const vib = input.machine_state.vibration_mm_s;
  if (typeof vib !== "number" || Number.isNaN(vib) || vib < 0 || vib > 100) {
    errors["vibration_mm_s"] = "Vibration must be between 0 and 100";
  }

  const hours = input.machine_state.operating_hours;
  if (
    typeof hours !== "number" ||
    Number.isNaN(hours) ||
    !Number.isInteger(hours) ||
    hours < 0
  ) {
    errors["operating_hours"] = "Operating hours must be an integer greater than or equal to 0";
  }

  if (!ALLOWED_STATUSES.includes(input.machine_state.status as any)) {
    errors["status"] = `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`;
  }

  // Operational Constraints
  const budget = input.operational_constraints.max_budget;
  if (typeof budget !== "number" || Number.isNaN(budget) || budget < 0) {
    errors["max_budget"] = "Max budget must be greater than or equal to 0";
  }

  const downtime = input.operational_constraints.max_downtime_hours;
  if (typeof downtime !== "number" || Number.isNaN(downtime) || downtime <= 0) {
    errors["max_downtime_hours"] = "Max downtime hours must be greater than 0";
  }

  const deadline = input.operational_constraints.deadline_hours;
  if (typeof deadline !== "number" || Number.isNaN(deadline) || deadline <= 0) {
    errors["deadline_hours"] = "Deadline hours must be greater than 0";
  }

  const downtimeCost = input.operational_constraints.downtime_cost_per_hour;
  if (
    typeof downtimeCost !== "number" ||
    Number.isNaN(downtimeCost) ||
    downtimeCost < 0
  ) {
    errors["downtime_cost_per_hour"] = "Downtime cost per hour must be greater than or equal to 0";
  }

  const riskFactor = input.operational_constraints.risk_cost_factor;
  if (
    typeof riskFactor !== "number" ||
    Number.isNaN(riskFactor) ||
    riskFactor < 0
  ) {
    errors["risk_cost_factor"] = "Risk cost factor must be greater than or equal to 0";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
