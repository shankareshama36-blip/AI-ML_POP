import { useState, useEffect } from "react";
import {
  listComplaints,
  evaluateComplaint,
  approveComplaint,
  rejectComplaint,
  type User,
  type Complaint,
} from "../api";
import {
  IconCheck,
  IconX,
  IconClock,
  IconShield,
  IconTrending,
  IconList,
  IconSpinner,
  IconLogout,
  IconClipboard,
} from "../components/Icons";

interface ApproverPageProps {
  user: User;
  onLogout: () => void;
}

const CANDIDATE_ACTIONS = [
  { id: "A", type: "REPAIR_NOW", desc: "Stop machine and repair immediately" },
  { id: "B", type: "CONTINUE_TEMP", desc: "Keep operating temporarily with monitoring" },
  { id: "C", type: "REDUCE_PROD", desc: "Reduce production load until maintenance" },
  { id: "D", type: "REALLOCATE", desc: "Reallocate work to another production line" },
];

const ROLE_STATUS_MAP: Record<string, string> = {
  maintenance_supervisor: "PENDING_MAINT",
  production_supervisor: "PENDING_PROD",
  plant_manager: "PENDING_PLANT",
};

function formatRole(role: string): string {
  switch (role) {
    case "technician":
      return "Technician";
    case "maintenance_supervisor":
      return "Maintenance Supervisor";
    case "production_supervisor":
      return "Production Supervisor";
    case "plant_manager":
      return "Plant Manager";
    default:
      return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function StatusBadge({ status }: { status: string }) {
  let badgeClass = "status-badge";
  let label = status;

  if (status === "APPROVED") {
    badgeClass += " approved";
    label = "Approved";
  } else if (status === "REJECTED") {
    badgeClass += " rejected";
    label = "Rejected";
  } else if (status === "PENDING_MAINT") {
    badgeClass += " pending";
    label = "Pending Maint";
  } else if (status === "PENDING_PROD") {
    badgeClass += " pending";
    label = "Pending Prod";
  } else if (status === "PENDING_PLANT") {
    badgeClass += " pending";
    label = "Pending Plant";
  } else {
    badgeClass += " pending";
  }

  return (
    <span className={badgeClass}>
      {status === "APPROVED" ? (
        <IconCheck size={10} />
      ) : status === "REJECTED" ? (
        <IconX size={10} />
      ) : (
        <IconClock size={10} />
      )}
      {label}
    </span>
  );
}

export function ApproverPage({ user, onLogout }: ApproverPageProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  async function fetchComplaints() {
    setLoadingList(true);
    setError(null);
    try {
      const data = await listComplaints(user);
      setComplaints(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].complaint_id);
      } else if (selectedId && !data.some((c) => c.complaint_id === selectedId)) {
        setSelectedId(data[0]?.complaint_id || null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const selectedComplaint = complaints.find((c) => c.complaint_id === selectedId) || null;

  async function handleEvaluate() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const updated = await evaluateComplaint(selectedId, user);
      setComplaints((prev) =>
        prev.map((c) => (c.complaint_id === updated.complaint_id ? updated : c))
      );
      setInfoMsg("AI evaluation complete. Decision attached.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const updated = await approveComplaint(selectedId, user, comment);
      setComment("");
      setComplaints((prev) =>
        prev.map((c) => (c.complaint_id === updated.complaint_id ? updated : c))
      );
      setInfoMsg("Approval recorded successfully.");
      await fetchComplaints();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const updated = await rejectComplaint(selectedId, user, comment);
      setComment("");
      setComplaints((prev) =>
        prev.map((c) => (c.complaint_id === updated.complaint_id ? updated : c))
      );
      setInfoMsg("Complaint rejected.");
      await fetchComplaints();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }

  const isRoleMatchingPending = selectedComplaint
    ? (user.role === "maintenance_supervisor" && selectedComplaint.status === "PENDING_MAINT") ||
      (user.role === "production_supervisor" && selectedComplaint.status === "PENDING_PROD") ||
      (user.role === "plant_manager" && selectedComplaint.status === "PENDING_PLANT")
    : false;

  const chainRoles =
    selectedComplaint && selectedComplaint.approval_chain.length > 0
      ? selectedComplaint.approval_chain
      : ["maintenance_supervisor", "production_supervisor", "plant_manager"];

  return (
    <div className="app-shell animate-fade">
      {/* Top App Bar */}
      <header className="app-bar">
        <div className="app-bar-left">
          <div className="app-logo">
            AM<span>&</span>POP
          </div>
          <span className="role-badge">{formatRole(user.role)}</span>
        </div>
        <div className="app-bar-right">
          <div className="user-chip">
            <div className="user-avatar">{user.username.slice(0, 1)}</div>
            <span>{user.username}</span>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout}>
            <IconLogout size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="page-main" style={{ maxWidth: "1200px" }}>
        <div className="page-header">
          <h1 className="page-title">Approval Queue</h1>
          <p className="page-subtitle">
            Inspect automated decision intelligence and authorize operational actions.
          </p>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: "16px" }}>
            <span>{error}</span>
          </div>
        )}
        {infoMsg && (
          <div className="toast" style={{ position: "static", marginBottom: "16px" }}>
            <span className="text-success">{infoMsg}</span>
          </div>
        )}

        <div className="approver-layout">
          {/* Card 1: Pending complaints list */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <IconList size={18} /> Pending Review Queue
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={fetchComplaints}
                disabled={loadingList}
                style={{ padding: "4px 8px" }}
              >
                {loadingList ? "…" : "↻"}
              </button>
            </div>

            {loadingList && complaints.length === 0 ? (
              <p className="text-muted">Loading pending queue…</p>
            ) : complaints.length === 0 ? (
              <div className="empty-state">
                <IconShield size={32} />
                <p>All clear. No complaints waiting for your approval.</p>
              </div>
            ) : (
              <div className="complaint-list">
                {complaints.map((item) => {
                  const isSelected = item.complaint_id === selectedId;
                  return (
                    <div
                      key={item.complaint_id}
                      className={`complaint-item ${isSelected ? "selected" : ""}`}
                      data-status={item.status}
                      onClick={() => {
                        setSelectedId(item.complaint_id);
                        setError(null);
                        setInfoMsg(null);
                      }}
                    >
                      <div>
                        <div className="complaint-id">#{item.complaint_id.slice(0, 8)}</div>
                        <div className="complaint-title">
                          {item.machine_id} — {item.problem_type}
                        </div>
                        <div className="complaint-meta">
                          By {item.submitted_by} · {new Date(item.submitted_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="badge-row">
                        <span className="severity-badge" data-sev={item.severity}>
                          {item.severity}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 2: Detail panel when one is selected */}
          <div className="card" style={{ marginBottom: 0 }}>
            {selectedComplaint ? (
              <div>
                <div className="card-header">
                  <div>
                    <div className="card-title" style={{ fontSize: "18px" }}>
                      Equipment Complaint: {selectedComplaint.machine_id}
                    </div>
                    <div className="complaint-meta" style={{ marginTop: "4px" }}>
                      Reported by <strong>{selectedComplaint.submitted_by}</strong> on{" "}
                      {new Date(selectedComplaint.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={selectedComplaint.status} />
                </div>

                {/* Complaint Info Grid */}
                <div className="detail-grid">
                  <div className="detail-field">
                    <span className="detail-label">Machine ID</span>
                    <span className="detail-value">{selectedComplaint.machine_id}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Problem Type</span>
                    <span className="detail-value">{selectedComplaint.problem_type}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Severity Level</span>
                    <span className="detail-value">
                      <span className="severity-badge" data-sev={selectedComplaint.severity}>
                        {selectedComplaint.severity}
                      </span>
                    </span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Complaint ID</span>
                    <span className="detail-value" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {selectedComplaint.complaint_id}
                    </span>
                  </div>
                  <div className="detail-field full">
                    <span className="detail-label">Technician Notes</span>
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-elevated)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {selectedComplaint.notes || "No notes provided."}
                    </div>
                  </div>
                </div>

                {/* Decision Section */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div className="card-title" style={{ marginBottom: "16px" }}>
                    <IconTrending size={18} /> AM&amp;POP Decision Intelligence
                  </div>

                  {!selectedComplaint.decision ? (
                    <div className="empty-state">
                      <p style={{ marginBottom: "16px" }}>
                        No automated decision has been evaluated yet for this complaint.
                      </p>
                      {user.role === "maintenance_supervisor" ? (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handleEvaluate}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <>
                              <IconSpinner size={16} /> Evaluating Decision Loop…
                            </>
                          ) : (
                            "⚡ Evaluate with AI Engine"
                          )}
                        </button>
                      ) : (
                        <p className="text-muted" style={{ fontStyle: "italic", fontSize: "13px" }}>
                          Waiting for Maintenance Supervisor to trigger AI evaluation.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Metric stat blocks: 4-column grid */}
                      <div className="metric-grid">
                        <div className="metric-block">
                          <div className="metric-label">Downtime</div>
                          <div className="metric-value">
                            {selectedComplaint.decision.expected_downtime}
                            <span className="metric-unit">h</span>
                          </div>
                        </div>
                        <div className="metric-block">
                          <div className="metric-label">Cost</div>
                          <div className="metric-value">
                            ₹{Number(selectedComplaint.decision.expected_cost || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="metric-block">
                          <div className="metric-label">Risk</div>
                          <div className="metric-value">
                            {selectedComplaint.decision.expected_risk}
                          </div>
                        </div>
                        <div className="metric-block">
                          <div className="metric-label">Confidence</div>
                          <div className="metric-value">
                            {selectedComplaint.decision.confidence !== undefined
                              ? `${(selectedComplaint.decision.confidence * 100).toFixed(0)}%`
                              : "—"}
                          </div>
                        </div>
                      </div>

                      {selectedComplaint.decision.reason && (
                        <div
                          style={{
                            padding: "12px 14px",
                            background: "var(--bg-elevated)",
                            borderLeft: "3px solid var(--brand)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            margin: "16px 0",
                          }}
                        >
                          <strong>Recommendation Rationale:</strong> Action{" "}
                          <code>{selectedComplaint.decision.recommended_action_id}</code>:{" "}
                          {selectedComplaint.decision.reason}
                        </div>
                      )}

                      {/* Alternatives Table */}
                      <div style={{ marginTop: "16px" }}>
                        <div className="detail-label" style={{ marginBottom: "8px" }}>
                          Candidate Alternatives
                        </div>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Action</th>
                              <th>Type</th>
                              <th>Description</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {CANDIDATE_ACTIONS.map((cand) => {
                              const isRecommended =
                                cand.id === selectedComplaint.decision?.recommended_action_id;
                              return (
                                <tr key={cand.id} className={isRecommended ? "best" : ""}>
                                  <td>
                                    <strong>{cand.id}</strong> {isRecommended && "★"}
                                  </td>
                                  <td>
                                    <code style={{ color: "var(--brand)" }}>{cand.type}</code>
                                  </td>
                                  <td>{cand.desc}</td>
                                  <td>
                                    {isRecommended ? (
                                      <span className="text-success">Optimal Choice</span>
                                    ) : (
                                      <span className="text-muted">Alternative</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline: Approval Chain */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div className="card-title" style={{ marginBottom: "16px" }}>
                    <IconShield size={18} /> Multi-Tier Approval Chain
                  </div>
                  <div className="timeline">
                    {chainRoles.map((role) => {
                      const done = selectedComplaint.approvals.some(
                        (a) => a.role === role && a.action === "APPROVED"
                      );
                      const rejected = selectedComplaint.approvals.some(
                        (a) => a.role === role && a.action === "REJECTED"
                      );
                      const current =
                        !done && !rejected && selectedComplaint.status === ROLE_STATUS_MAP[role];
                      const approvalEntry = selectedComplaint.approvals.find((a) => a.role === role);

                      return (
                        <div className="timeline-item" key={role}>
                          <div
                            className={`timeline-dot ${
                              done ? "done" : rejected ? "rejected" : current ? "current" : "pending"
                            }`}
                          >
                            {done ? <IconCheck size={12} /> : rejected ? <IconX size={12} /> : null}
                          </div>
                          <div>
                            <strong>{formatRole(role)}</strong>{" "}
                            {done
                              ? `· approved by ${approvalEntry?.username}`
                              : rejected
                              ? `· rejected by ${approvalEntry?.username}`
                              : current
                              ? "· awaiting review now"
                              : "· pending next tier"}
                            {approvalEntry?.comment && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text-muted)",
                                  fontStyle: "italic",
                                  marginTop: "2px",
                                }}
                              >
                                "{approvalEntry.comment}"
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Decision Actions / Authorizations */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div className="card-title" style={{ marginBottom: "12px" }}>
                    Supervisor Authorization
                  </div>

                  {isRoleMatchingPending ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div className="form-field">
                        <label className="form-label">Review Remarks / Conditions</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          placeholder="Add approval comments or operational conditions..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>

                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          type="button"
                          className="btn-success"
                          onClick={handleApprove}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <>
                              <IconSpinner size={16} /> Processing…
                            </>
                          ) : (
                            <>
                              <IconCheck size={16} /> Approve Decision
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={handleReject}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <>
                              <IconSpinner size={16} /> Processing…
                            </>
                          ) : (
                            <>
                              <IconX size={16} /> Reject Decision
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "14px 16px",
                        background: "var(--bg-elevated)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "13px",
                      }}
                    >
                      {selectedComplaint.status === "APPROVED" ? (
                        <span className="text-success">
                          ✓ This maintenance decision has been fully APPROVED by all required tiers.
                        </span>
                      ) : selectedComplaint.status === "REJECTED" ? (
                        <span className="text-danger">
                          ✕ This maintenance complaint was REJECTED during supervisor review.
                        </span>
                      ) : (
                        <span className="text-secondary">
                          ⏳ Waiting for <strong>{formatRole(selectedComplaint.status.replace("PENDING_", "").toLowerCase())}</strong> review.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <IconClipboard size={32} />
                <p>Select a complaint from the queue to view details and authorize.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
