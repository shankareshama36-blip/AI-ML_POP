import { useState } from "react";
import {
  evaluateDecision,
  approveDecision,
  type DecisionResponse,
} from "./api";
import "./App.css";

function App() {
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      const d = await evaluateDecision();
      setDecision(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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

      <button onClick={handleRun} disabled={loading}>
        {loading ? "Running…" : "Evaluate Decision"}
      </button>

      {error && <div className="error">Error: {error}</div>}

      {decision && (
        <>
          <section className="decision">
            <h2>Recommended Decision</h2>
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
        </>
      )}
    </div>
  );
}

export default App;