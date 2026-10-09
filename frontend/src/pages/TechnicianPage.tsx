import { useState, useEffect, type FormEvent } from "react";
import {
  createComplaint,
  listComplaints,
  ApiError,
  type User,
  type Complaint,
} from "../api";
import {
  IconPlus,
  IconList,
  IconClipboard,
  IconCheck,
  IconX,
  IconClock,
  IconSpinner,
  IconLogout,
} from "../components/Icons";

interface TechnicianPageProps {
  user: User;
  onLogout: () => void;
}

const MACHINE_OPTIONS = [
  "M-101",
  "M-102",
  "M-201",
  "M-220",
  "M-303",
  "M-404",
  "M-510",
  "Other",
];

const PROBLEM_OPTIONS = [
  "Overheating",
  "Vibration",
  "Unusual noise",
  "Oil leak",
  "Electrical fault",
  "Performance drop",
  "Physical damage",
  "Other",
];

const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

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
    label = "Pending Plant Mgr";
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

export function TechnicianPage({ user, onLogout }: TechnicianPageProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [selectedMachine, setSelectedMachine] = useState(MACHINE_OPTIONS[0]);
  const [customMachine, setCustomMachine] = useState("");

  const [selectedProblem, setSelectedProblem] = useState(PROBLEM_OPTIONS[0]);
  const [customProblem, setCustomProblem] = useState("");

  const [severity, setSeverity] = useState(SEVERITY_OPTIONS[1]); // MEDIUM
  const [notes, setNotes] = useState("");

  async function fetchComplaints() {
    setLoadingList(true);
    try {
      const data = await listComplaints(user);
      setComplaints(data);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) onLogout();
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const machineId =
      selectedMachine === "Other" ? customMachine.trim() : selectedMachine;
    const problemType =
      selectedProblem === "Other" ? customProblem.trim() : selectedProblem;

    if (!machineId) {
      setError("Please specify a Machine ID.");
      return;
    }
    if (!problemType) {
      setError("Please specify a Problem Type.");
      return;
    }

    setSubmitting(true);
    try {
      await createComplaint(
        {
          machine_id: machineId,
          problem_type: problemType,
          severity,
          notes: notes.trim(),
        },
        user
      );
      setSuccessMsg(`Complaint for ${machineId} submitted successfully.`);
      // Reset form
      setNotes("");
      if (selectedMachine === "Other") setCustomMachine("");
      if (selectedProblem === "Other") setCustomProblem("");
      fetchComplaints();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) onLogout();
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell animate-fade">
      {/* Top App Bar */}
      <header className="app-bar">
        <div className="app-bar-left">
          <div className="app-logo">
            AM<span>&</span>POP
          </div>
          <span className="role-badge">Technician</span>
        </div>
        <div className="app-bar-right">
          <div className="user-chip">
            <div className="user-avatar">{user.email.slice(0, 1)}</div>
            <span>{user.email}</span>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout}>
            <IconLogout size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="page-main">
        <div className="page-header">
          <h1 className="page-title">Technician Dashboard</h1>
          <p className="page-subtitle">
            Report machine issues and track their automated resolution workflow.
          </p>
        </div>

        {/* Section 1: Report New Complaint Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconPlus size={18} /> Report New Complaint
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            {error && (
              <div className="login-error" style={{ gridColumn: "1 / -1" }}>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="toast" style={{ position: "static", gridColumn: "1 / -1" }}>
                <span className="text-success">{successMsg}</span>
              </div>
            )}

            <div className="form-field">
              <label className="form-label">Machine ID</label>
              <select
                className="form-select"
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
              >
                {MACHINE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {selectedMachine === "Other" && (
                <input
                  type="text"
                  className="form-input animate-slide-up"
                  placeholder="Enter Machine ID (e.g. M-999)"
                  value={customMachine}
                  onChange={(e) => setCustomMachine(e.target.value)}
                  style={{ marginTop: "8px" }}
                  required
                />
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Problem Type</label>
              <select
                className="form-select"
                value={selectedProblem}
                onChange={(e) => setSelectedProblem(e.target.value)}
              >
                {PROBLEM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {selectedProblem === "Other" && (
                <input
                  type="text"
                  className="form-input animate-slide-up"
                  placeholder="Enter custom problem description"
                  value={customProblem}
                  onChange={(e) => setCustomProblem(e.target.value)}
                  style={{ marginTop: "8px" }}
                  required
                />
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Severity Level</label>
              <select
                className="form-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field full">
              <label className="form-label">Operational Notes / Symptoms</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe machine behavior, abnormal telemetry, unusual noises, or symptoms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="form-field full">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <IconSpinner size={16} /> Submitting Complaint…
                  </>
                ) : (
                  <>
                    <IconPlus size={16} /> Submit Complaint
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Complaints List Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconList size={18} /> My Complaints{" "}
              <span className="status-badge pending">{complaints.length}</span>
            </div>
            <button
              type="button"
              className="btn-ghost"
              onClick={fetchComplaints}
              disabled={loadingList}
            >
              {loadingList ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>

          <div className="complaint-list">
            {complaints.map((item) => (
              <div
                key={item.complaint_id}
                className="complaint-item"
                data-status={item.status}
              >
                <div>
                  <div className="complaint-id">#{item.complaint_id.slice(0, 8)}</div>
                  <div className="complaint-title">
                    {item.machine_id} — {item.problem_type}
                  </div>
                  {item.notes && <div className="complaint-meta">{item.notes}</div>}
                  <div className="complaint-meta">
                    Submitted: {new Date(item.submitted_at).toLocaleString()}
                  </div>

                  {item.decision && (
                    <div className="complaint-decision-mini">
                      <strong>AI Recommendation:</strong> Action{" "}
                      <code>{item.decision.recommended_action_id}</code> | Est. Cost: ₹
                      {Number(item.decision.expected_cost || 0).toLocaleString()} | Downtime:{" "}
                      {item.decision.expected_downtime}h | Risk:{" "}
                      {item.decision.expected_risk}
                    </div>
                  )}

                  {item.approvals && item.approvals.length > 0 && (
                    <div className="approval-history-mini">
                      <strong>Approval Log:</strong>
                      <ul>
                        {item.approvals.map((appr, idx) => (
                          <li key={idx}>
                            <span
                              className={
                                appr.action === "APPROVED"
                                  ? "text-success"
                                  : "text-danger"
                              }
                            >
                              {appr.action}
                            </span>{" "}
                            by <code>{appr.username}</code> ({appr.role})
                            {appr.comment ? ` — "${appr.comment}"` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="badge-row">
                  <span className="severity-badge" data-sev={item.severity}>
                    {item.severity}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>

          {complaints.length === 0 && (
            <div className="empty-state">
              <IconClipboard size={32} />
              <p>No complaints yet. Submit your first one above.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
