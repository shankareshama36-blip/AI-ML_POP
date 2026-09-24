import { useState, useEffect, useMemo } from "react";
import {
  evaluateDecision,
  approveDecision,
  type DecisionInput,
  type DecisionResponse,
} from "./api";
import { DecisionExplanation } from "./DecisionExplanation";
import { validateDecisionInput } from "./validation";
import "./App.css";

const EMPTY_INPUT: DecisionInput = {
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

function App() {
  const [input, setInput] = useState<DecisionInput>(EMPTY_INPUT);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const validation = useMemo(() => validateDecisionInput(input), [input]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowExplanation(false);
      }
    }
    if (showExplanation) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showExplanation]);

  function updateRequest<K extends keyof DecisionInput["maintenance_request"]>(
    field: K,
    value: DecisionInput["maintenance_request"][K]
  ) {
    setInput((prev) => ({
      ...prev,
      maintenance_request: { ...prev.maintenance_request, [field]: value },
    }));
  }

  function updateState<K extends keyof DecisionInput["machine_state"]>(
    field: K,
    value: DecisionInput["machine_state"][K]
  ) {
    setInput((prev) => ({
      ...prev,
      machine_state: { ...prev.machine_state, [field]: value },
    }));
  }

  function updateConstraints<
    K extends keyof DecisionInput["operational_constraints"]
  >(
    field: K,
    value: DecisionInput["operational_constraints"][K]
  ) {
    setInput((prev) => ({
      ...prev,
      operational_constraints: {
        ...prev.operational_constraints,
        [field]: value,
      },
    }));
  }

  function formatErrorMessage(e: unknown): string {
    if (e instanceof TypeError && e.message.toLowerCase().includes("fetch")) {
      return "Cannot reach backend. Is it running on port 8000?";
    }
    const message = e instanceof Error ? e.message : String(e);
    if (message.toLowerCase().includes("failed to fetch") || message.toLowerCase().includes("networkerror")) {
      return "Cannot reach backend. Is it running on port 8000?";
    }

    const httpMatch = message.match(/^HTTP (\d+): (.*)$/s);
    if (httpMatch) {
      const status = parseInt(httpMatch[1], 10);
      const rawBody = httpMatch[2];

      let parsedMsg = rawBody;
      try {
        const json = JSON.parse(rawBody);
        if (json.detail) {
          if (typeof json.detail === "string") {
            parsedMsg = json.detail;
          } else if (json.detail.message) {
            parsedMsg = json.detail.message;
          } else if (json.detail.validation?.reason) {
            parsedMsg = json.detail.validation.reason;
          } else if (Array.isArray(json.detail)) {
            parsedMsg = json.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
          } else {
            parsedMsg = JSON.stringify(json.detail);
          }
        }
      } catch {
        // use raw body
      }

      if (status === 409) {
        return `No feasible action: ${parsedMsg}`;
      }
      if (status === 422) {
        return `Formal validation failed: ${parsedMsg}`;
      }
      if (status >= 500 && status <= 599) {
        return "Server error. Try again.";
      }
      return parsedMsg;
    }

    return message;
  }

  async function handleRun() {
    if (loading || !validation.valid) return;
    setLoading(true);
    setError(null);
    try {
      const d = await evaluateDecision(input);
      setDecision(d);
    } catch (e) {
      setError(formatErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!decision) return;
    setLoading(true);
    setError(null);
    try {
      const d = await approveDecision(
        decision.decision.decision_id,
        "manager-1"
      );
      setDecision(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>AM&amp;POP</h1>
        <p>AI can act. AM&amp;POP decides.</p>
      </header>

      <section className="form-section">
        <h2>1. Maintenance Request</h2>
        <div className="grid">
          <label>
            Machine ID
            <select
              value={input.maintenance_request.machine_id}
              onChange={(e) => updateRequest("machine_id", e.target.value)}
            >
              {["M-101", "M-102", "M-201", "M-220", "M-303", "M-404", "M-510"].map(
                (m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                )
              )}
            </select>
            {validation.errors["machine_id"] && (
              <span className="field-error">{validation.errors["machine_id"]}</span>
            )}
          </label>

          <label>
            Maintenance Type
            <select
              value={input.maintenance_request.maintenance_type}
              onChange={(e) =>
                updateRequest("maintenance_type", e.target.value)
              }
            >
              {["PREVENTIVE", "CORRECTIVE", "INSPECTION", "PREDICTIVE"].map(
                (t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                )
              )}
            </select>
            {validation.errors["maintenance_type"] && (
              <span className="field-error">
                {validation.errors["maintenance_type"]}
              </span>
            )}
          </label>

          <label>
            Priority
            <select
              value={input.maintenance_request.priority}
              onChange={(e) => updateRequest("priority", e.target.value)}
            >
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {validation.errors["priority"] && (
              <span className="field-error">{validation.errors["priority"]}</span>
            )}
          </label>

          <label>
            Condition
            <select
              value={input.maintenance_request.condition}
              onChange={(e) => updateRequest("condition", e.target.value)}
            >
              {["NORMAL", "WARN", "ALERT", "CRITICAL"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {validation.errors["condition"] && (
              <span className="field-error">{validation.errors["condition"]}</span>
            )}
          </label>

          <label>
            Action
            <select
              value={input.maintenance_request.action}
              onChange={(e) => updateRequest("action", e.target.value)}
            >
              {["INSPECT", "REPAIR", "REPLACE", "SHUTDOWN", "PAUSE_PRODUCTION"].map(
                (a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                )
              )}
            </select>
            {validation.errors["action"] && (
              <span className="field-error">{validation.errors["action"]}</span>
            )}
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>2. Machine State</h2>
        <div className="grid">
          <label>
            Temperature (°C)
            <input
              type="number"
              step="0.1"
              value={input.machine_state.temperature_c}
              onChange={(e) =>
                updateState("temperature_c", Number(e.target.value))
              }
            />
            {validation.errors["temperature_c"] && (
              <span className="field-error">
                {validation.errors["temperature_c"]}
              </span>
            )}
          </label>

          <label>
            Vibration (mm/s)
            <input
              type="number"
              step="0.1"
              value={input.machine_state.vibration_mm_s}
              onChange={(e) =>
                updateState("vibration_mm_s", Number(e.target.value))
              }
            />
            {validation.errors["vibration_mm_s"] && (
              <span className="field-error">
                {validation.errors["vibration_mm_s"]}
              </span>
            )}
          </label>

          <label>
            Operating Hours
            <input
              type="number"
              value={input.machine_state.operating_hours}
              onChange={(e) =>
                updateState("operating_hours", Number(e.target.value))
              }
            />
            {validation.errors["operating_hours"] && (
              <span className="field-error">
                {validation.errors["operating_hours"]}
              </span>
            )}
          </label>

          <label>
            Status
            <select
              value={input.machine_state.status}
              onChange={(e) => updateState("status", e.target.value)}
            >
              {["RUNNING", "DEGRADED", "OFFLINE"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {validation.errors["status"] && (
              <span className="field-error">{validation.errors["status"]}</span>
            )}
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>3. Operational Constraints</h2>
        <div className="grid">
          <label>
            Max Budget (₹)
            <input
              type="number"
              value={input.operational_constraints.max_budget}
              onChange={(e) =>
                updateConstraints("max_budget", Number(e.target.value))
              }
            />
            {validation.errors["max_budget"] && (
              <span className="field-error">
                {validation.errors["max_budget"]}
              </span>
            )}
          </label>

          <label>
            Max Downtime (hours)
            <input
              type="number"
              step="0.1"
              value={input.operational_constraints.max_downtime_hours}
              onChange={(e) =>
                updateConstraints("max_downtime_hours", Number(e.target.value))
              }
            />
            {validation.errors["max_downtime_hours"] && (
              <span className="field-error">
                {validation.errors["max_downtime_hours"]}
              </span>
            )}
          </label>

          <label>
            Deadline (hours)
            <input
              type="number"
              step="0.1"
              value={input.operational_constraints.deadline_hours}
              onChange={(e) =>
                updateConstraints("deadline_hours", Number(e.target.value))
              }
            />
            {validation.errors["deadline_hours"] && (
              <span className="field-error">
                {validation.errors["deadline_hours"]}
              </span>
            )}
          </label>

          <label>
            Downtime Cost (₹/hour)
            <input
              type="number"
              value={input.operational_constraints.downtime_cost_per_hour}
              onChange={(e) =>
                updateConstraints(
                  "downtime_cost_per_hour",
                  Number(e.target.value)
                )
              }
            />
            {validation.errors["downtime_cost_per_hour"] && (
              <span className="field-error">
                {validation.errors["downtime_cost_per_hour"]}
              </span>
            )}
          </label>

          <label>
            Risk Cost Factor
            <input
              type="number"
              value={input.operational_constraints.risk_cost_factor}
              onChange={(e) =>
                updateConstraints("risk_cost_factor", Number(e.target.value))
              }
            />
            {validation.errors["risk_cost_factor"] && (
              <span className="field-error">
                {validation.errors["risk_cost_factor"]}
              </span>
            )}
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={input.operational_constraints.technicians_available}
              onChange={(e) =>
                updateConstraints("technicians_available", e.target.checked)
              }
            />
            Technicians Available
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={input.operational_constraints.spare_parts_available}
              onChange={(e) =>
                updateConstraints("spare_parts_available", e.target.checked)
              }
            />
            Spare Parts Available
          </label>
        </div>
      </section>

      <button onClick={handleRun} disabled={loading || !validation.valid}>
        {loading ? (
          <>
            <span className="spinner" /> Evaluating…
          </>
        ) : (
          "Evaluate Decision"
        )}
      </button>

      {error && <div className="error-box">Error: {error}</div>}

      {decision && (
        <>
          <section className="decision">
            <div className="section-header-row">
              <h2>Recommended Decision</h2>
              <button
                type="button"
                className="why-link"
                onClick={() => setShowExplanation(true)}
              >
                Why this decision?
              </button>
            </div>
            <p>
              <strong>Action:</strong>{" "}
              {decision.decision.recommended_action_id}
            </p>
            <p>
              <strong>Expected cost:</strong> ₹
              {decision.decision.expected_cost.toFixed(2)}
            </p>
            <p>
              <strong>Expected downtime:</strong>{" "}
              {decision.decision.expected_downtime.toFixed(2)} hours
            </p>
            <p>
              <strong>Risk:</strong> {decision.decision.expected_risk}
            </p>
            <p>
              <strong>Confidence:</strong>{" "}
              {(decision.decision.confidence * 100).toFixed(1)}%
            </p>
            <p className="reason">{decision.decision.reason}</p>
          </section>

          <section>
            <h2>Alternatives</h2>
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Downtime</th>
                  <th>Cost</th>
                  <th>Risk</th>
                  <th>Feasible</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {decision.predictions.map((p) => {
                  const c = decision.constraint_results.find(
                    (x) => x.action_id === p.action_id
                  );
                  const score = decision.optimization.scores[p.action_id];
                  const isBest =
                    p.action_id === decision.decision.recommended_action_id;
                  return (
                    <tr key={p.action_id} className={isBest ? "best" : ""}>
                      <td>
                        {p.action_id} {isBest && "★"}
                      </td>
                      <td>{p.predicted_downtime_hours.toFixed(2)}h</td>
                      <td>₹{p.predicted_cost.toFixed(0)}</td>
                      <td>{p.predicted_risk_score.toFixed(2)}</td>
                      <td>
                        {c?.is_feasible
                          ? "Yes"
                          : `No (${c?.violations.join(", ")})`}
                      </td>
                      <td>{score !== undefined ? score.toFixed(0) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="approval">
            <h2>Approval</h2>
            <p>
              <strong>Status:</strong> {decision.approval.status}
            </p>
            {decision.approval.approver_id && (
              <p>
                <strong>Approved by:</strong> {decision.approval.approver_id}
              </p>
            )}
            {decision.approval.status === "PENDING" && (
              <button onClick={handleApprove} disabled={loading}>
                Approve as manager-1
              </button>
            )}
          </section>

          <section>
            <h2>Decision Trace</h2>
            <p>
              <strong>DFA final state:</strong>{" "}
              {decision.formal_validation.final_state}
            </p>
            <p>
              <strong>Trace:</strong>{" "}
              {decision.formal_validation.trace.join(" → ")}
            </p>
          </section>

          {showExplanation && (
            <div
              className="modal-overlay"
              onClick={() => setShowExplanation(false)}
            >
              <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Why This Decision?</h2>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowExplanation(false)}
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>
                <DecisionExplanation decision={decision} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;