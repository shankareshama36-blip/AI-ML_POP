const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface ComplaintCreateInput {
  machine_id: string;
  problem_type: string;
  severity: string;
  notes?: string;
}

export interface ApprovalEntry {
  role: string;
  username: string;
  timestamp: string;
  action: string;
  comment?: string;
}

export interface ComplaintDecision {
  decision_id?: string;
  recommended_action_id?: string;
  expected_cost?: number;
  expected_downtime?: number;
  expected_risk?: string;
  confidence?: number;
  reason?: string;
  predictions?: Array<{
    action_id: string;
    predicted_downtime_hours: number;
    predicted_cost: number;
    predicted_risk_score: number;
    confidence: number;
  }>;
  [key: string]: unknown;
}

export interface Complaint {
  complaint_id: string;
  machine_id: string;
  problem_type: string;
  severity: string;
  notes: string;
  submitted_by: string;
  submitted_at: string;
  status: string;
  decision: ComplaintDecision | null;
  approval_chain: string[];
  approvals: ApprovalEntry[];
}

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

export interface AuthResult {
  token: string;
  user: User;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("am-pop-token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export async function signup(email: string, password: string, role: string): Promise<AuthResult> {
  return request<AuthResult>("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, role }) });
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return request<AuthResult>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function verifyToken(): Promise<User> {
  return (await request<{ user: User }>("/auth/verify", { method: "POST" })).user;
}

export function logout(): void {
  localStorage.removeItem("am-pop-token");
  localStorage.removeItem("am-pop-user");
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("am-pop-token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

export async function createComplaint(
  payload: ComplaintCreateInput,
  user: User
): Promise<Complaint> {
  void user;
  const res = await fetch(`${BASE}/complaints`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export async function listComplaints(user: User): Promise<Complaint[]> {
  void user;
  const res = await fetch(`${BASE}/complaints`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export async function getComplaint(
  id: string,
  user: User
): Promise<Complaint> {
  void user;
  const res = await fetch(`${BASE}/complaints/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export async function evaluateComplaint(
  id: string,
  user: User
): Promise<Complaint> {
  void user;
  const res = await fetch(`${BASE}/complaints/${id}/evaluate`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export async function approveComplaint(
  id: string,
  user: User,
  comment: string = ""
): Promise<Complaint> {
  void user;
  const res = await fetch(`${BASE}/complaints/${id}/approve`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ comment }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export async function rejectComplaint(
  id: string,
  user: User,
  comment: string = ""
): Promise<Complaint> {
  void user;
  const res = await fetch(`${BASE}/complaints/${id}/reject`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ comment }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
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
    throw new ApiError(res.status, text);
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
    throw new ApiError(res.status, text);
  }
  return res.json();
}
