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
  context?: {
    machine_id?: string;
    maintenance_type?: string;
    priority?: string;
    condition?: string;
    action?: string;
    maintenance_request?: Partial<MaintenanceRequestInput>;
    machine_state?: Partial<MachineStateInput>;
    operational_constraints?: Partial<OperationalConstraintsInput>;
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

type SlowLoadingListener = (isSlow: boolean) => void;
const slowLoadingListeners: Set<SlowLoadingListener> = new Set();
let inFlightCount = 0;
let slowTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribeSlowLoading(listener: SlowLoadingListener): () => void {
  slowLoadingListeners.add(listener);
  return () => {
    slowLoadingListeners.delete(listener);
  };
}

function startRequestTimer() {
  inFlightCount++;
  if (inFlightCount === 1) {
    if (slowTimer) clearTimeout(slowTimer);
    slowTimer = setTimeout(() => {
      if (inFlightCount > 0) {
        slowLoadingListeners.forEach((fn) => fn(true));
      }
    }, 2000);
  }
}

function endRequestTimer() {
  inFlightCount = Math.max(0, inFlightCount - 1);
  if (inFlightCount === 0) {
    if (slowTimer) {
      clearTimeout(slowTimer);
      slowTimer = null;
    }
    slowLoadingListeners.forEach((fn) => fn(false));
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 60000
): Promise<Response> {
  const isHealthCheck = url.includes("/health");
  if (!isHealthCheck) startRequestTimer();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", () => controller.abort());
    }
  }

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s. The backend may be waking up (cold start). Please try again.`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (!isHealthCheck) endRequestTimer();
  }
}

export async function pingHealth(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${BASE}/health`, { method: "GET" }, 15000);
    return res.ok;
  } catch {
    return false;
  }
}

async function request<T>(path: string, options: RequestInit = {}, timeoutMs = 60000): Promise<T> {
  const token = localStorage.getItem("praxis-token") ?? sessionStorage.getItem("praxis-token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const maxRetries = 2;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(`${BASE}${path}`, { ...options, headers }, timeoutMs);

      // Render free-tier cold start retry on gateway errors
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        try {
          const parsed = JSON.parse(body) as { detail?: string };
          throw new ApiError(res.status, parsed.detail || body);
        } catch (error) {
          if (error instanceof ApiError) throw error;
          throw new ApiError(res.status, body);
        }
      }
      return (await res.json()) as T;
    } catch (err: unknown) {
      lastError = err;
      if (err instanceof ApiError) {
        throw err;
      }
      // If network error during possible cold start, retry with backoff
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export async function signup(
  email: string,
  password: string,
  role: "technician" | "maintenance_supervisor" | "production_supervisor" | "plant_manager" = "technician",
): Promise<AuthResult> {
  return request<AuthResult>("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, role }) });
}

const DEMO_ACCOUNT_IDENTIFIERS = new Set([
  "tech@praxis.local",
  "maint@praxis.local",
  "prod@praxis.local",
  "plant@praxis.local",
  "tech@ampop.local",
  "maint@ampop.local",
  "prod@ampop.local",
  "plant@ampop.local",
  "tech-1",
  "maint-sup",
  "prod-sup",
  "plant-mgr",
  "tech",
  "maint",
  "prod",
  "plant",
]);

export async function login(email: string, password: string, isDemo = false): Promise<AuthResult> {
  const isDemoRequest = isDemo || DEMO_ACCOUNT_IDENTIFIERS.has(email.trim().toLowerCase());
  const query = isDemoRequest ? "?demo=true" : "";
  return request<AuthResult>(`/auth/login${query}`, {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password }),
  });
}

export async function requestPasswordReset(email: string): Promise<{ message: string; reset_token?: string }> {
  return request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: email.trim() }) });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await request<void>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token: token.trim(), password }) });
}

export async function verifyToken(): Promise<User> {
  return (await request<{ user: User }>("/auth/verify", { method: "POST" })).user;
}

export function logout(): void {
  localStorage.removeItem("praxis-token");
  localStorage.removeItem("praxis-user");
  sessionStorage.removeItem("praxis-token");
  sessionStorage.removeItem("praxis-user");
  localStorage.removeItem("am-pop-token");
  localStorage.removeItem("am-pop-user");
  sessionStorage.removeItem("am-pop-token");
  sessionStorage.removeItem("am-pop-user");
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("praxis-token") ?? sessionStorage.getItem("praxis-token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

export async function createComplaint(
  payload: ComplaintCreateInput,
  user: User
): Promise<Complaint> {
  void user;
  const res = await fetchWithTimeout(`${BASE}/complaints`, {
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
  const res = await fetchWithTimeout(`${BASE}/complaints`, {
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
  const res = await fetchWithTimeout(`${BASE}/complaints/${id}`, {
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
  const res = await fetchWithTimeout(`${BASE}/complaints/${id}/evaluate`, {
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
  const res = await fetchWithTimeout(`${BASE}/complaints/${id}/approve`, {
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
  const res = await fetchWithTimeout(`${BASE}/complaints/${id}/reject`, {
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
  const res = await fetchWithTimeout(`${BASE}/decisions/evaluate`, {
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
  const res = await fetchWithTimeout(`${BASE}/decisions/${decisionId}/approval`, {
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

export async function getDecisionsCount(): Promise<number> {
  try {
    const data = await request<{ count?: number }>("/analytics/decisions-count", { method: "GET" }, 15000);
    return Number.isFinite(data.count) ? data.count ?? 0 : 0;
  } catch {
    return 0;
  }
}
