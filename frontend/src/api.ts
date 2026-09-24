const BASE = "/api";

export interface MaintenanceRequestInput {
  machine_id: string;
  maintenance_type: string;
  priority: string;
  condition: string;
  action: string;
}

export interface MachineStateInput {
  temperature_c: number;
  vibration_mm_s: number;
  operating_hours: number;
  status: string;
}

export interface OperationalConstraintsInput {
  max_budget: number;
  max_downtime_hours: number;
  deadline_hours: number;
  technicians_available: boolean;
  spare_parts_available: boolean;
  downtime_cost_per_hour: number;
  risk_cost_factor: number;
}

export interface DecisionInput {
  maintenance_request: MaintenanceRequestInput;
  machine_state: MachineStateInput;
  operational_constraints: OperationalConstraintsInput;
}

export interface DecisionResponse {
  request_id: string;
  timestamp: string;
  formal_validation: {
    accepted: boolean;
    final_state: string;
    reason: string;
    trace: string[];
  };
  candidate_actions: Array<{
    action_id: string;
    action_type: string;
    description: string;
  }>;
  predictions: Array<{
    action_id: string;
    predicted_downtime_hours: number;
    predicted_cost: number;
    predicted_risk_score: number;
    confidence: number;
  }>;
  constraint_results: Array<{
    action_id: string;
    is_feasible: boolean;
    violations: string[];
  }>;
  optimization: {
    feasible_actions: string[];
    scores: Record<string, number>;
    best_action_id: string;
  };
  decision: {
    decision_id: string;
    recommended_action_id: string;
    expected_cost: number;
    expected_downtime: number;
    expected_risk: string;
    confidence: number;
    reason: string;
  };
  approval: {
    decision_id: string;
    status: string;
    approver_id: string | null;
    timestamp: string;
  };
}

export async function evaluateDecision(
  input: DecisionInput
): Promise<DecisionResponse> {
  const res = await fetch(`${BASE}/decisions/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export async function approveDecision(
  decisionId: string,
  approverId: string
): Promise<DecisionResponse> {
  const res = await fetch(`${BASE}/decisions/${decisionId}/approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "APPROVED",
      approver_id: approverId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}