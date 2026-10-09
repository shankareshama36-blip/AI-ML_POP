import { useState, useEffect } from "react";
import {
  listComplaints,
  evaluateComplaint,
  approveComplaint,
  rejectComplaint,
  type User,
  type Complaint,
} from "../api";

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
      // Refresh list to update role-pending queue
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

  function getStepLabel(status: string) {
    switch (status) {
      case "PENDING_MAINT":
        return "Maintenance Supervisor";
      case "PENDING_PROD":
        return "Production Supervisor";
      case "PENDING_PLANT":
        return "Plant Manager";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      default:
        return status;
    }
  }

  function renderStatusBadge(status: string) {
    let badgeClass = "status-badge";
    if (status === "APPROVED") badgeClass += " status-approved";
    else if (status === "REJECTED") badgeClass += " status-rejected";
    else badgeClass += " status-pending";

    return <span className={badgeClass}>{getStepLabel(status)}</span>;
  }

  const isRoleMatchingPending = selectedComplaint
    ? (user.role === "maintenance_supervisor" && selectedComplaint.status === "PENDING_MAINT") ||
      (user.role === "production_supervisor" && selectedComplaint.status === "PENDING_PROD") ||
      (user.role === "plant_manager" && selectedComplaint.status === "PENDING_PLANT")
    : false;

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <h1>AM&amp;POP Approver Portal</h1>
          <p>Autonomous Maintenance &amp; Planning Optimization Platform</p>
        </div>
        <div className="user-profile-bar">
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="role-badge">{user.role}</span>
          </div>
          <button type="button" className="btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-box">{error}</div>}
      {infoMsg && <div className="success-box">{infoMsg}</div>}

      <div className="approver-layout">
        {/* Left column: Pending Complaints */}
        <section className="approver-sidebar">
          <div className="section-header-row">
            <h2>Pending Complaints</h2>
            <button
              type="button"
              className="btn-refresh"
              onClick={fetchComplaints}
              disabled={loadingList}
            >
              {loadingList ? "…" : "↻"}
            </button>
          </div>

          {loadingList && complaints.length === 0 ? (
            <p className="loading-text">Loading complaints…</p>
          ) : complaints.length === 0 ? (
            <p className="empty-text">No pending complaints for your role.</p>
          ) : (
            <div className="complaint-list">
              {complaints.map((item) => {
                const isSelected = item.complaint_id === selectedId;
                return (
                  <div
                    key={item.complaint_id}
                    className={`complaint-card selectable ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedId(item.complaint_id);
                      setError(null);
                      setInfoMsg(null);
                    }}
                  >
                    <div className="complaint-card-header">
                      <span className="complaint-machine">{item.machine_id}</span>
                      {renderStatusBadge(item.status)}
                    </div>
                    <div className="complaint-card-body">
                      <span className="complaint-problem">{item.problem_type}</span>
                      <span className={`severity-tag severity-${item.severity.toLowerCase()}`}>
                        {item.severity}
                      </span>
                    </div>
                    <div className="complaint-card-footer">
                      <small>By: {item.submitted_by}</small>
                      <small>{new Date(item.submitted_at).toLocaleTimeString()}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right column: Complaint Detail Panel */}
        <section className="detail-panel">
          {selectedComplaint ? (
            <>
              <div className="detail-header">
                <div>
                  <h2>Complaint: {selectedComplaint.machine_id}</h2>
                  <p className="detail-meta">
                    Reported by <strong>{selectedComplaint.submitted_by}</strong> on{" "}
                    {new Date(selectedComplaint.submitted_at).toLocaleString()}
                  </p>
                </div>
                <div>{renderStatusBadge(selectedComplaint.status)}</div>
              </div>

              <div className="detail-grid">
                <div className="detail-field">
                  <span className="label">Problem Type</span>
                  <span className="value">{selectedComplaint.problem_type}</span>
                </div>
                <div className="detail-field">
                  <span className="label">Severity</span>
                  <span className="value">
                    <span className={`severity-tag severity-${selectedComplaint.severity.toLowerCase()}`}>
                      {selectedComplaint.severity}
                    </span>
                  </span>
                </div>
                <div className="detail-field full-width">
                  <span className="label">Operational Notes</span>
                  <p className="notes-box">{selectedComplaint.notes || "No notes provided."}</p>
                </div>
              </div>

              {/* AI Decision Section */}
              <div className="decision-section">
                <h3>AM&amp;POP Decision Intelligence</h3>

                {!selectedComplaint.decision ? (
                  <div className="decision-pending-box">
                    <p>No decision has been evaluated yet for this complaint.</p>
                    {user.role === "maintenance_supervisor" ? (
                      <button
                        type="button"
                        className="btn-evaluate"
                        onClick={handleEvaluate}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <span className="spinner" /> Running AI Decision Loop…
                          </>
                        ) : (
                          "⚡ Evaluate with AI Engine"
                        )}
                      </button>
                    ) : (
                      <p className="waiting-text">
                        Waiting for Maintenance Supervisor to trigger AI evaluation.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="decision-card">
                    <div className="decision-metrics-grid">
                      <div className="metric-box">
                        <span className="metric-label">Recommended Action</span>
                        <span className="metric-value highlight">
                          {selectedComplaint.decision.recommended_action_id}
                        </span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Estimated Cost</span>
                        <span className="metric-value">
                          ₹{Number(selectedComplaint.decision.expected_cost || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Expected Downtime</span>
                        <span className="metric-value">
                          {selectedComplaint.decision.expected_downtime} hrs
                        </span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Risk Level</span>
                        <span className="metric-value">
                          {selectedComplaint.decision.expected_risk}
                        </span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Model Confidence</span>
                        <span className="metric-value">
                          {selectedComplaint.decision.confidence !== undefined
                            ? `${(selectedComplaint.decision.confidence * 100).toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {selectedComplaint.decision.reason && (
                      <p className="reason-text">
                        <strong>Optimizer Rationale:</strong> {selectedComplaint.decision.reason}
                      </p>
                    )}

                    {/* Alternatives Table */}
                    <div className="alternatives-section">
                      <h4>Action Candidates &amp; Alternatives</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Action ID</th>
                            <th>Action Type</th>
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
                                  <code>{cand.type}</code>
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

              {/* Approval History */}
              {selectedComplaint.approvals && selectedComplaint.approvals.length > 0 && (
                <div className="approval-history">
                  <h3>Approval History</h3>
                  <ul>
                    {selectedComplaint.approvals.map((appr, index) => (
                      <li key={index} className="approval-history-item">
                        <div className="approval-history-header">
                          <span
                            className={
                              appr.action === "APPROVED" ? "text-success" : "text-danger"
                            }
                          >
                            {appr.action}
                          </span>
                          <span className="approval-user">
                            by <strong>{appr.username}</strong> ({appr.role})
                          </span>
                          <span className="approval-time">
                            {new Date(appr.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {appr.comment && (
                          <div className="approval-comment">"{appr.comment}"</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Human-in-the-Loop Action Form */}
              <div className="approval-action-card">
                <h3>Manager Decision</h3>

                {isRoleMatchingPending ? (
                  <div className="approval-form">
                    <label>
                      Decision Comments / Operational Instructions
                      <textarea
                        rows={2}
                        placeholder="Add remarks or requirements for this decision..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={actionLoading}
                      />
                    </label>

                    <div className="action-buttons-row">
                      <button
                        type="button"
                        className="btn-approve"
                        onClick={handleApprove}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Processing…" : "✓ Approve Action"}
                      </button>
                      <button
                        type="button"
                        className="btn-reject"
                        onClick={handleReject}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Processing…" : "✕ Reject"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="waiting-banner">
                    {selectedComplaint.status === "APPROVED" ? (
                      <span className="text-success">
                        ✓ This maintenance decision has been fully APPROVED.
                      </span>
                    ) : selectedComplaint.status === "REJECTED" ? (
                      <span className="text-danger">
                        ✕ This complaint was REJECTED during review.
                      </span>
                    ) : (
                      <span>
                        ⏳ Waiting for <strong>{getStepLabel(selectedComplaint.status)}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <p>Select a complaint from the pending list to review details and approve.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
