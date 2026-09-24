import React from "react";
import type { DecisionResponse } from "./api";

interface DecisionExplanationProps {
  decision: DecisionResponse;
  onClose?: () => void;
}

export const DecisionExplanation: React.FC<DecisionExplanationProps> = ({
  decision,
}) => {
  const {
    decision: rec,
    candidate_actions,
    predictions,
    constraint_results,
    optimization,
    formal_validation,
    approval,
  } = decision;

  // Optional context if sent by backend
  const context = (decision as unknown as { context?: any }).context;

  const winnerActionId = rec.recommended_action_id;
  const winnerCandidate = candidate_actions.find(
    (a) => a.action_id === winnerActionId
  );
  const winnerName = winnerCandidate
    ? `${winnerCandidate.action_id} (${winnerCandidate.description})`
    : winnerActionId;

  // Feasible actions and scores
  const feasibleActions = optimization.feasible_actions || [];
  const scores = optimization.scores || {};
  const winnerScore = scores[winnerActionId];

  // Find second best feasible action if any
  const otherFeasible = feasibleActions
    .filter((id) => id !== winnerActionId && scores[id] !== undefined)
    .sort((a, b) => scores[a] - scores[b]);

  const secondBestId = otherFeasible.length > 0 ? otherFeasible[0] : null;
  const secondBestScore = secondBestId !== null ? scores[secondBestId] : undefined;

  // Infeasible actions
  const infeasibleResults = constraint_results.filter((c) => !c.is_feasible);

  // Fallbacks for snapshot
  const machineId =
    context?.maintenance_request?.machine_id ??
    context?.machine_id ??
    "—";
  const maintenanceType =
    context?.maintenance_request?.maintenance_type ??
    context?.maintenance_type ??
    "—";
  const priority = context?.priority ?? "—";
  const condition = context?.condition ?? "—";
  const actionRequested =
    context?.maintenance_request?.action ?? context?.action ?? "—";

  const temp = context?.machine_state?.temperature_c ?? "—";
  const vibration = context?.machine_state?.vibration_mm_s ?? "—";
  const hours = context?.machine_state?.operating_hours ?? "—";
  const status = context?.machine_state?.status ?? "—";

  const maxBudget = context?.operational_constraints?.max_budget;
  const deadline = context?.operational_constraints?.deadline_hours;
  const techAvailable =
    context?.operational_constraints?.technicians_available;
  const sparePartsAvailable =
    context?.operational_constraints?.spare_parts_available;

  const downtimeCostPerHour =
    context?.operational_constraints?.downtime_cost_per_hour ?? 1000;
  const riskCostFactor =
    context?.operational_constraints?.risk_cost_factor ?? 5000;

  return (
    <div className="explanation-container">
      {/* SECTION 1 — Summary */}
      <section className="explanation-section">
        <h3>1. Summary</h3>
        <p>
          AM&amp;POP recommends action <strong>{winnerName}</strong>. It is feasible
          within all constraints and has the lowest combined score of{" "}
          <strong>
            {winnerScore !== undefined ? `₹${winnerScore.toLocaleString()}` : "—"}
          </strong>{" "}
          with an expected cost of ₹{rec.expected_cost.toFixed(2)}, downtime of{" "}
          {rec.expected_downtime.toFixed(2)} hours, and {rec.expected_risk} risk.
          It was chosen because it achieved the lowest combined score among all
          feasible candidate actions.
          {otherFeasible.length > 0 && (
            <span>
              {" "}Lower than{" "}
              {otherFeasible
                .map((id) => `action ${id} (₹${scores[id]?.toLocaleString()})`)
                .join(", ")}.
            </span>
          )}
          {infeasibleResults.length > 0 && (
            <span>
              {" "}Action{" "}
              {infeasibleResults.map((r) => r.action_id).join(", ")}{" "}
              {infeasibleResults.length === 1 ? "was" : "were"} rejected because
              of constraint violation(s).
            </span>
          )}
        </p>
      </section>

      {/* SECTION 2 — Situation Snapshot */}
      <section className="explanation-section">
        <h3>2. Situation Snapshot</h3>
        <table>
          <thead>
            <tr>
              <th>Request Parameters</th>
              <th>Machine State</th>
              <th>Operational Constraints</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div><strong>Machine ID:</strong> {machineId}</div>
                <div><strong>Type:</strong> {maintenanceType}</div>
                <div><strong>Priority:</strong> {priority}</div>
                <div><strong>Condition:</strong> {condition}</div>
                <div><strong>Action:</strong> {actionRequested}</div>
              </td>
              <td>
                <div><strong>Temperature:</strong> {temp !== "—" ? `${temp} °C` : "—"}</div>
                <div><strong>Vibration:</strong> {vibration !== "—" ? `${vibration} mm/s` : "—"}</div>
                <div><strong>Operating Hours:</strong> {hours}</div>
                <div><strong>Status:</strong> {status}</div>
              </td>
              <td>
                <div><strong>Max Budget:</strong> {maxBudget !== undefined ? `₹${maxBudget}` : "—"}</div>
                <div><strong>Deadline:</strong> {deadline !== undefined ? `${deadline}h` : "—"}</div>
                <div><strong>Technicians:</strong> {techAvailable !== undefined ? (techAvailable ? "Yes" : "No") : "—"}</div>
                <div><strong>Spare Parts:</strong> {sparePartsAvailable !== undefined ? (sparePartsAvailable ? "Yes" : "No") : "—"}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* SECTION 3 — Actions Considered */}
      <section className="explanation-section">
        <h3>3. Actions Considered</h3>
        <div className="cards-grid">
          {predictions.map((p) => {
            const cand = candidate_actions.find((a) => a.action_id === p.action_id);
            const constraint = constraint_results.find(
              (c) => c.action_id === p.action_id
            );
            const isFeasible = constraint?.is_feasible ?? false;
            const score = scores[p.action_id];
            const isWinner = p.action_id === winnerActionId;

            return (
              <div
                key={p.action_id}
                className={`card ${isWinner ? "winner" : !isFeasible ? "rejected" : ""}`}
              >
                <h4>
                  Action {p.action_id}: {cand?.action_type || p.action_id}
                  {isWinner && " ★ (Recommended)"}
                </h4>
                {cand?.description && <p className="card-desc">{cand.description}</p>}
                <p><strong>Predicted Downtime:</strong> {p.predicted_downtime_hours.toFixed(2)} hrs</p>
                <p><strong>Predicted Cost:</strong> ₹{p.predicted_cost.toFixed(2)}</p>
                <p><strong>Predicted Risk:</strong> {p.predicted_risk_score.toFixed(2)}</p>
                <p><strong>Confidence:</strong> {(p.confidence * 100).toFixed(1)}%</p>
                <p>
                  <strong>Status:</strong>{" "}
                  {isFeasible ? (
                    <span className="text-success">Feasible</span>
                  ) : (
                    <span className="text-danger">
                      Infeasible ({constraint?.violations.join(", ") || "Violations detected"})
                    </span>
                  )}
                </p>
                <p>
                  <strong>Optimization Score:</strong>{" "}
                  {score !== undefined ? `₹${score.toLocaleString()}` : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4 — Scoring Formula */}
      <section className="explanation-section">
        <h3>4. Scoring Formula</h3>
        <pre className="formula-block">
{`score = predicted_cost
        + predicted_downtime_hours × downtime_cost_per_hour
        + predicted_risk_score × risk_cost_factor`}
        </pre>
        <p className="formula-note">
          Using downtime cost = ₹{downtimeCostPerHour}/hr, risk factor = ₹{riskCostFactor}
        </p>
        <div className="scores-list">
          {feasibleActions.map((actionId) => {
            const pred = predictions.find((p) => p.action_id === actionId);
            const score = scores[actionId];
            const isWinner = actionId === winnerActionId;
            if (!pred) return null;
            return (
              <div
                key={actionId}
                className={`score-item ${isWinner ? "winner" : ""}`}
              >
                <div>
                  <strong>Action {actionId}:</strong> ₹{pred.predicted_cost.toFixed(0)} + (
                  {pred.predicted_downtime_hours.toFixed(2)}h × ₹{downtimeCostPerHour}) + (
                  {pred.predicted_risk_score.toFixed(2)} × ₹{riskCostFactor}) ={" "}
                  <strong>{score !== undefined ? `₹${score.toLocaleString()}` : "—"}</strong>
                  {isWinner && " (Lowest Score / Selected)"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5 — Why the winner won */}
      <section className="explanation-section">
        <h3>5. Why the Winner Won</h3>
        <p>
          Action <strong>{winnerActionId}</strong> won with a combined score of{" "}
          <strong>{winnerScore !== undefined ? `₹${winnerScore.toLocaleString()}` : "—"}</strong>.
          {secondBestId && secondBestScore !== undefined && winnerScore !== undefined ? (
            <>
              {" "}The second-best feasible alternative was Action{" "}
              <strong>{secondBestId}</strong> with a score of{" "}
              <strong>₹{secondBestScore.toLocaleString()}</strong>, resulting in a cost savings
              difference of <strong>₹{(secondBestScore - winnerScore).toLocaleString()}</strong>.
            </>
          ) : (
            " It was the only feasible action meeting all operational constraints."
          )}
          {infeasibleResults.length > 0 && (
            <>
              {" "}Infeasible actions were excluded due to specific violations:{" "}
              {infeasibleResults
                .map((r) => `Action ${r.action_id} (${r.violations.join(", ")})`)
                .join("; ")}
              .
            </>
          )}
        </p>
      </section>

      {/* SECTION 6 — DFA validation trail */}
      <section className="explanation-section">
        <h3>6. DFA Validation Trail</h3>
        <div className="trace-box">
          <code>{formal_validation.trace.join(" → ")}</code>
        </div>
        <p>
          <strong>Final State:</strong> <code>{formal_validation.final_state}</code>{" "}
          ({formal_validation.accepted ? "Accepted" : "Rejected"})
        </p>
        <p className="reason">
          <strong>Validation Reason:</strong> {formal_validation.reason}
        </p>
      </section>

      {/* SECTION 7 — Approval status */}
      <section className="explanation-section">
        <h3>7. Approval Status</h3>
        <p>
          <strong>Status:</strong>{" "}
          <span className={`status-badge status-${approval.status.toLowerCase()}`}>
            {approval.status}
          </span>
        </p>
        {approval.approver_id && (
          <p>
            <strong>Approver ID:</strong> {approval.approver_id}
          </p>
        )}
        {approval.timestamp && (
          <p>
            <strong>Timestamp:</strong> {new Date(approval.timestamp).toLocaleString()}
          </p>
        )}
      </section>
    </div>
  );
};

export default DecisionExplanation;
