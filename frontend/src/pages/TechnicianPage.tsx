import { useState, useEffect, type FormEvent } from "react";
import {
  createComplaint,
  listComplaints,
  type User,
  type Complaint,
} from "../api";

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
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  function renderStatusBadge(status: string) {
    let badgeClass = "status-badge";
    let label = status;

    if (status === "APPROVED") {
      badgeClass += " status-approved";
      label = "Approved";
    } else if (status === "REJECTED") {
      badgeClass += " status-rejected";
      label = "Rejected";
    } else if (status === "PENDING_MAINT") {
      badgeClass += " status-pending";
      label = "Pending Maintenance";
    } else if (status === "PENDING_PROD") {
      badgeClass += " status-pending";
      label = "Pending Production";
    } else if (status === "PENDING_PLANT") {
      badgeClass += " status-pending";
      label = "Pending Plant Mgr";
    } else {
      badgeClass += " status-pending";
    }

    return <span className={badgeClass}>{label}</span>;
  }

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <h1>AM&amp;POP Technician Portal</h1>
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

      <section className="form-section">
        <h2>Submit New Maintenance Complaint</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          {successMsg && <div className="success-box">{successMsg}</div>}

          <div className="grid">
            <label>
              Machine ID
              <select
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
                  placeholder="Enter Machine ID (e.g. M-999)"
                  value={customMachine}
                  onChange={(e) => setCustomMachine(e.target.value)}
                  style={{ marginTop: "6px" }}
                  required
                />
              )}
            </label>

            <label>
              Problem Type
              <select
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
                  placeholder="Enter problem type description"
                  value={customProblem}
                  onChange={(e) => setCustomProblem(e.target.value)}
                  style={{ marginTop: "6px" }}
                  required
                />
              )}
            </label>

            <label>
              Severity Level
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ gridColumn: "span 2" }}>
              Operational Notes / Observations
              <textarea
                rows={3}
                placeholder="Describe machine behavior, strange sounds, temperature spikes, or symptoms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner" /> Submitting Complaint…
              </>
            ) : (
              "Submit Complaint"
            )}
          </button>
        </form>
      </section>

      <section>
        <div className="section-header-row">
          <h2>My Submitted Complaints</h2>
          <button
            type="button"
            className="btn-refresh"
            onClick={fetchComplaints}
            disabled={loadingList}
          >
            {loadingList ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>

        {loadingList && complaints.length === 0 ? (
          <p className="loading-text">Loading your complaints…</p>
        ) : complaints.length === 0 ? (
          <p className="empty-text">
            No complaints submitted yet. Use the form above to report a machine issue.
          </p>
        ) : (
          <div className="complaint-list">
            {complaints.map((item) => (
              <div key={item.complaint_id} className="complaint-card">
                <div className="complaint-card-header">
                  <div className="complaint-title-group">
                    <span className="complaint-machine">{item.machine_id}</span>
                    <span className="complaint-problem">{item.problem_type}</span>
                    <span className={`severity-tag severity-${item.severity.toLowerCase()}`}>
                      {item.severity}
                    </span>
                  </div>
                  {renderStatusBadge(item.status)}
                </div>

                {item.notes && <p className="complaint-notes">{item.notes}</p>}

                <div className="complaint-meta-row">
                  <span>
                    Submitted: {new Date(item.submitted_at).toLocaleString()}
                  </span>
                  <span>ID: {item.complaint_id.slice(0, 8)}…</span>
                </div>

                {item.decision && (
                  <div className="complaint-decision-mini">
                    <strong>AI Recommendation:</strong> Action{" "}
                    <code>{item.decision.recommended_action_id}</code> | Est. Cost: ₹
                    {Number(item.decision.expected_cost || 0).toLocaleString()} | Est.
                    Downtime: {item.decision.expected_downtime}h | Risk:{" "}
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
