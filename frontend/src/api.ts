const BASE = "/api";

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

export async function evaluateDecision(): Promise<DecisionResponse> {
  const payload = {
    maintenance_request: {
      machine_id: "M-101",
      maintenance_type: "CORRECTIVE",
      priority: "HIGH",
      condition: "ALERT",
      action: "REPAIR",
    },
    machine_state: {
      temperature_c: 92,
      vibration_mm_s: 7.5,
      operating_hours: 1800,
      status: "DEGRADED",
    },
    operational_constraints: {
      max_budget: 50000,
      max_downtime_hours: 12,
      deadline_hours: 8,
      technicians_available: true,
      spare_parts_available: true,
      downtime_cost_per_hour: 1000,
      risk_cost_factor: 5000,
    },
  };

  const res = await fetch(`${BASE}/decisions/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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