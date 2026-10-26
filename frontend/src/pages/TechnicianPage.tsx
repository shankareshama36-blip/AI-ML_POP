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
  IconCheck,
  IconX,
  IconClock,
  IconSpinner,
  IconLogout,
  IconSettings,
} from "../components/Icons";
import { Logo } from "../components/Logo";
import { useToast, formatUserFriendlyError } from "../components/Toast";

interface TechnicianPageProps {
  user: User;
  onLogout: () => void;
  onOpenSettings?: () => void;
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

export function TechnicianPage({ user, onLogout, onOpenSettings }: TechnicianPageProps) {
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      if (err instanceof ApiError && err.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        onLogout();
        return;
      }
      showToast(formatUserFriendlyError(err), "error");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    // Defer the request so loading state is updated after the effect commits.
    const task = window.setTimeout(() => { void fetchComplaints(); }, 0);
    return () => window.clearTimeout(task);
    // fetchComplaints intentionally reads the current page props and state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const machineId =
      selectedMachine === "Other" ? customMachine.trim() : selectedMachine;
    const problemType =
      selectedProblem === "Other" ? customProblem.trim() : selectedProblem;

    if (!machineId) {
      showToast("Please specify a Machine ID.", "warning");
      return;
    }
    if (!problemType) {
      showToast("Please specify a Problem Type.", "warning");
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
      showToast(`Complaint for ${machineId} submitted successfully.`, "success");
      // Reset form
      setNotes("");
      if (selectedMachine === "Other") setCustomMachine("");
      if (selectedProblem === "Other") setCustomProblem("");
      fetchComplaints();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        onLogout();
        return;
      }
      showToast(formatUserFriendlyError(err), "error");
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
            <Logo />
          </div>
          <span className="role-badge">Technician</span>
        </div>
        <div className="app-bar-right">
          <div className="user-chip">
            <div className="user-avatar">{user.email.slice(0, 1)}</div>
            <span>{user.email}</span>
          </div>
          {(user.role === "plant_manager" || Boolean(user.is_admin)) && onOpenSettings && (
            <button
              type="button"
              className="action-btn secondary"
              style={{ padding: "6px 12px", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={onOpenSettings}
              title="Workspace Settings & Thresholds"
            >
              <IconSettings size={14} /> Settings
            </button>
          )}
          <button type="button" className="logout-btn" onClick={onLogout}>
            <IconLogout size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      {/* Main Page Area: 70% data table, 30% report form */}
      <main className="page-main">
        <div className="page-header">
          <h1 className="page-title">Technician Dashboard</h1>
          <p className="page-subtitle">
            Report machine issues and track their automated resolution workflow.
          </p>
        </div>

        <div className="dashboard-grid technician-grid">
          {/* Main Content (70%): Complaints Data Table */}
          <div className="card dashboard-data-card">
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
                aria-label="Refresh complaints list"
              >
                {loadingList ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>

            {loadingList && complaints.length === 0 ? (
              <div className="skeleton-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-line" style={{ width: "25%", height: "12px", marginBottom: "8px" }} />
                    <div className="skeleton-line" style={{ width: "65%", height: "16px", marginBottom: "8px" }} />
                    <div className="skeleton-line" style={{ width: "40%", height: "12px" }} />
                  </div>
                ))}
              </div>
            ) : complaints.length === 0 ? (
              <div className="empty-state empty-state-card animate-fade">
                <div className="empty-state-icon-wrap success">
                  <IconCheck size={32} />
                </div>
                <h4 className="empty-state-title">No pending complaints. All clear!</h4>
                <p className="empty-state-subtitle">Submit a machine issue from the panel to initiate an automated evaluation.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Machine &amp; Issue</th>
                      <th>Severity</th>
                      <th>AI Decision</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((item) => (
                      <tr key={item.complaint_id} className="data-table-row">
                        <td>
                          <div className="table-cell-title">
                            {item.machine_id} — {item.problem_type}
                          </div>
                          <div className="table-cell-sub">
                            #{item.complaint_id.slice(0, 8)}
                            {item.notes ? ` · ${item.notes}` : ""}
                          </div>
                        </td>
                        <td>
                          <span className="severity-badge" data-sev={item.severity}>
                            {item.severity}
                          </span>
                        </td>
                        <td>
                          {item.decision ? (
                            <div className="decision-cell-inline">
                              <span className="decision-action-tag">
                                {item.decision.recommended_action_id}
                              </span>
                              <span className="decision-cost-tag">
                                ₹{Number(item.decision.expected_cost || 0).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontSize: "12px" }}>Awaiting AI</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="text-muted" style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                          {new Date(item.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Details / Action Sidebar (30%): Report New Issue */}
          <div className="card dashboard-sidebar-card">
            <div className="card-header">
              <div className="card-title">
                <IconPlus size={18} /> Report Machine Issue
              </div>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-field full">
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

              <div className="form-field full">
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

              <div className="form-field full">
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
                  placeholder="Abnormal telemetry, vibration, noises, symptoms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="form-field full">
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <IconSpinner size={16} /> Submitting Issue…
                    </>
                  ) : (
                    <>
                      <IconPlus size={16} /> Submit Issue
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
