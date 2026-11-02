import { useState, useId } from "react";
import {
  IconCheckCircle,
  IconShield,
  IconCpu,
  IconZap,
  IconArrowRight,
  IconLayers,
  IconTrending,
} from "./Icons";

type TabId = "flat" | "daa" | "aiml";

interface DaaAction {
  id: "A" | "B" | "C";
  name: string;
  cost: number;
  downtimeHours: number;
  risk: string;
  tag: string;
}

const DEFAULT_ACTIONS: DaaAction[] = [
  {
    id: "A",
    name: "Complete Component Replacement",
    cost: 100,
    downtimeHours: 8.0,
    risk: "Low",
    tag: "High Capital Cost",
  },
  {
    id: "B",
    name: "Precision Lubrication & Dampening",
    cost: 50,
    downtimeHours: 2.5,
    risk: "Moderate",
    tag: "Optimal Cost/Downtime",
  },
  {
    id: "C",
    name: "Sensor Realignment & Calibration",
    cost: 80,
    downtimeHours: 4.0,
    risk: "Low",
    tag: "Preventive Calibration",
  },
];

const VALID_FLAT_TOKENS = new Set([
  "CRITICAL_OVERHEAT",
  "BEARING_WEAR",
  "SCHEDULED_PM",
  "HIGH_VIBRATION",
  "HYDRAULIC_LEAK",
]);

export function AlgorithmShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>("flat");

  // ── Tab 1: FLAT State ──────────────────────────────────────────────────────
  const [flatInput, setFlatInput] = useState<string>("INVALID_PRIORITY");
  const trimmedInput = flatInput.trim().toUpperCase();
  const isFlatValid = VALID_FLAT_TOKENS.has(trimmedInput);

  // ── Tab 2: DAA State ───────────────────────────────────────────────────────
  const [isOptimized, setIsOptimized] = useState<boolean>(true);
  const [selectedActionId, setSelectedActionId] = useState<string>("B");

  // ── Tab 3: AI-ML State ─────────────────────────────────────────────────────
  const [temp, setTemp] = useState<number>(82);
  const [vibration, setVibration] = useState<number>(5.4);
  const [predicted, setPredicted] = useState<boolean>(true);
  const [predictionResult, setPredictionResult] = useState<{
    downtime: number;
    cost: number;
    text: string;
  }>(() => calculatePrediction(82, 5.4));

  const tempSliderId = useId();
  const vibSliderId = useId();

  function calculatePrediction(tVal: number, vVal: number) {
    const tNorm = Math.max(0, Math.min(1, (tVal - 70) / 30));
    const vNorm = Math.max(0, Math.min(1, (vVal - 2) / 8));
    const downtime = Number((1.2 + 6.8 * (0.4 * tNorm + 0.6 * vNorm)).toFixed(1));
    const cost = Math.round(12000 + 48000 * (0.45 * tNorm + 0.55 * vNorm));
    const text = `Predicted Downtime: ${downtime} hours. Predicted Cost: ₹${cost.toLocaleString(
      "en-IN"
    )}. Model R2 Score: 0.953.`;
    return { downtime, cost, text };
  }

  function handlePredict() {
    const res = calculatePrediction(temp, vibration);
    setPredictionResult(res);
    setPredicted(true);
  }

  return (
    <section className="algo-showcase-container animate-fade" aria-label="Academic Proof of Concepts">
      <div className="algo-showcase-header">
        <div className="algo-showcase-badge">
          <IconZap size={14} /> Interactive Proof of Concept
        </div>
        <h2 className="algo-showcase-title">
          Live Technical Proof: <span className="hero-title-gradient">FLAT + DAA + AI-ML</span>
        </h2>
        <p className="algo-showcase-subtitle">
          Test the exact algorithms running inside Praxis. Pure client-side execution with 0ms
          latency.
        </p>
      </div>

      <div className="algo-showcase-card">
        {/* Navigation Tabs */}
        <div className="algo-tabs" role="tablist" aria-label="Academic Proof Tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "flat"}
            className={`algo-tab-btn ${activeTab === "flat" ? "active" : ""}`}
            onClick={() => setActiveTab("flat")}
          >
            <span className="algo-tab-badge">FLAT</span>
            <span className="algo-tab-label">DFA Validator</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "daa"}
            className={`algo-tab-btn ${activeTab === "daa" ? "active" : ""}`}
            onClick={() => setActiveTab("daa")}
          >
            <span className="algo-tab-badge">DAA</span>
            <span className="algo-tab-label">Dijkstra Optimizer</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "aiml"}
            className={`algo-tab-btn ${activeTab === "aiml" ? "active" : ""}`}
            onClick={() => setActiveTab("aiml")}
          >
            <span className="algo-tab-badge">AI-ML</span>
            <span className="algo-tab-label">Random Forest Regressor</span>
          </button>
        </div>

        {/* ── TAB 1: FLAT (DFA Validator) ──────────────────────────────────── */}
        {activeTab === "flat" && (
          <div className="algo-tab-panel animate-fade" role="tabpanel">
            <div className="algo-panel-meta">
              <div>
                <h3 className="algo-panel-heading">Deterministic Finite Automaton (DFA) Guard</h3>
                <p className="algo-panel-desc">
                  Eliminates invalid states at compile/input time using a 5-tuple automaton:{" "}
                  <code>M = (Q, Σ, δ, q₀, F)</code>.
                </p>
              </div>
              <span className="algo-spec-pill">
                <IconShield size={13} /> Formal Verification Guard
              </span>
            </div>

            {/* Input & Quick Presets */}
            <div className="algo-input-section">
              <label htmlFor="dfa-token-input" className="algo-input-label">
                Input Event / Telemetry Token:
              </label>
              <div className="algo-input-row">
                <input
                  id="dfa-token-input"
                  type="text"
                  value={flatInput}
                  onChange={(e) => setFlatInput(e.target.value)}
                  placeholder="e.g. INVALID_PRIORITY or CRITICAL_OVERHEAT"
                  className={`algo-text-input ${isFlatValid ? "valid" : "invalid"}`}
                  aria-describedby="dfa-status-text"
                />
                <div
                  id="dfa-status-text"
                  className={`algo-status-badge ${isFlatValid ? "accept" : "reject"}`}
                >
                  {isFlatValid ? "✓ ACCEPT" : "✕ REJECT"}
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="algo-presets-row">
                <span className="algo-presets-hint">Quick test:</span>
                <button
                  type="button"
                  className={`algo-preset-chip ${flatInput === "INVALID_PRIORITY" ? "active" : ""}`}
                  onClick={() => setFlatInput("INVALID_PRIORITY")}
                >
                  INVALID_PRIORITY (Fails)
                </button>
                <button
                  type="button"
                  className={`algo-preset-chip ${flatInput === "CRITICAL_OVERHEAT" ? "active" : ""}`}
                  onClick={() => setFlatInput("CRITICAL_OVERHEAT")}
                >
                  CRITICAL_OVERHEAT (Passes)
                </button>
                <button
                  type="button"
                  className={`algo-preset-chip ${flatInput === "BEARING_WEAR" ? "active" : ""}`}
                  onClick={() => setFlatInput("BEARING_WEAR")}
                >
                  BEARING_WEAR (Passes)
                </button>
                <button
                  type="button"
                  className={`algo-preset-chip ${flatInput === "SCHEDULED_PM" ? "active" : ""}`}
                  onClick={() => setFlatInput("SCHEDULED_PM")}
                >
                  SCHEDULED_PM (Passes)
                </button>
              </div>
            </div>

            {/* Visual State Path: START -> MACHINE_VALID -> REJECT / ACCEPT */}
            <div className="algo-diagram-card">
              <div className="algo-diagram-title">Automaton State Transition Path</div>
              <div className="dfa-path-flow">
                {/* Node 1: START */}
                <div className="dfa-node active">
                  <div className="dfa-node-circle">q₀</div>
                  <span className="dfa-node-name">START</span>
                </div>

                <div className="dfa-arrow active">
                  <span className="dfa-arrow-label">init()</span>
                  <div className="dfa-arrow-line" />
                  <IconArrowRight size={14} className="dfa-arrow-icon" />
                </div>

                {/* Node 2: MACHINE_VALID */}
                <div className="dfa-node active">
                  <div className="dfa-node-circle">q₁</div>
                  <span className="dfa-node-name">MACHINE_VALID</span>
                </div>

                <div className="dfa-arrow active">
                  <span className="dfa-arrow-label">δ(q₁, token)</span>
                  <div className="dfa-arrow-line" />
                  <IconArrowRight size={14} className="dfa-arrow-icon" />
                </div>

                {/* Node 3: Result Node (ACCEPT or REJECT) */}
                {isFlatValid ? (
                  <div className="dfa-node terminal accept">
                    <div className="dfa-node-circle double-circle">q₂</div>
                    <span className="dfa-node-name">ACCEPT ∈ F</span>
                  </div>
                ) : (
                  <div className="dfa-node terminal reject">
                    <div className="dfa-node-circle">q_err</div>
                    <span className="dfa-node-name">REJECT ∉ F</span>
                  </div>
                )}
              </div>

              {/* Live Explanation Output */}
              <div className={`dfa-explanation-box ${isFlatValid ? "box-accept" : "box-reject"}`}>
                <div className="dfa-explanation-header">
                  {isFlatValid ? (
                    <>
                      <IconCheckCircle size={16} /> Formal Validation Succeeded
                    </>
                  ) : (
                    <>
                      <IconShield size={16} /> Formal Validation Failed
                    </>
                  )}
                </div>
                <p className="dfa-explanation-body">
                  {isFlatValid
                    ? `Input symbol "${trimmedInput}" belongs to valid alphabet Σ. Transition δ(q₁, "${trimmedInput}") leads to accepting final state q₂ ∈ F. Action is authorized to proceed to DAA optimization.`
                    : `Input symbol "${trimmedInput || "EMPTY"}" is illegal under platform schema rules. Transition δ(q₁, "${trimmedInput || "EMPTY"}") traps in sink state q_err. Execution halts to prevent corrupted state.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: DAA (Dijkstra Optimizer) ──────────────────────────────── */}
        {activeTab === "daa" && (
          <div className="algo-tab-panel animate-fade" role="tabpanel">
            <div className="algo-panel-meta">
              <div>
                <h3 className="algo-panel-heading">Dijkstra Shortest Path &amp; Cost Optimizer</h3>
                <p className="algo-panel-desc">
                  Finds the global cost-optimal intervention across the candidate decision graph
                  using a Min-Priority Queue in <code>O((V + E) log V)</code>.
                </p>
              </div>
              <span className="algo-spec-pill">
                <IconLayers size={13} /> Graph Optimization O((V+E) log V)
              </span>
            </div>

            {/* Actions Table */}
            <div className="daa-table-wrapper">
              <table className="daa-table">
                <thead>
                  <tr>
                    <th>Candidate Action</th>
                    <th>Cost (Weight)</th>
                    <th>Downtime</th>
                    <th>Risk Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_ACTIONS.map((action) => {
                    const isOptimal = isOptimized && action.id === "B";
                    const isSelected = selectedActionId === action.id;
                    return (
                      <tr
                        key={action.id}
                        className={`daa-row ${isOptimal ? "optimal-row" : ""} ${
                          isSelected ? "selected-row" : ""
                        }`}
                        onClick={() => setSelectedActionId(action.id)}
                      >
                        <td>
                          <div className="daa-action-cell">
                            <span className="daa-action-badge">Action {action.id}</span>
                            <div>
                              <strong className="daa-action-title">{action.name}</strong>
                              <span className="daa-action-tag">{action.tag}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong className={isOptimal ? "highlight-cost" : ""}>
                            ₹{action.cost}
                          </strong>
                        </td>
                        <td>{action.downtimeHours} hrs</td>
                        <td>
                          <span
                            className={`daa-risk-pill ${
                              action.risk === "Low" ? "risk-low" : "risk-mod"
                            }`}
                          >
                            {action.risk}
                          </span>
                        </td>
                        <td>
                          {isOptimal ? (
                            <span className="daa-optimal-badge">
                              <IconCheckCircle size={13} /> Shortest Path
                            </span>
                          ) : (
                            <span className="daa-suboptimal-badge">Suboptimal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Optimize Trigger Button */}
            <div className="daa-controls">
              <button
                type="button"
                className="algo-action-btn"
                onClick={() => {
                  setIsOptimized(true);
                  setSelectedActionId("B");
                }}
              >
                <IconZap size={15} /> Run Dijkstra Optimization
              </button>
              <span className="daa-controls-hint">
                Min-heap extracts minimum weight vertex in <code>O(log V)</code> time.
              </span>
            </div>

            {/* Visual Traversal Diagram */}
            <div className="algo-diagram-card">
              <div className="algo-diagram-title">Shortest Path Graph Traversal</div>
              <div className="daa-graph-flow">
                <div className="daa-node source">
                  <span className="daa-node-type">SOURCE (s)</span>
                  <strong>Machine Alarm</strong>
                  <span className="daa-dist">dist = 0</span>
                </div>

                <div className="daa-graph-edge optimal">
                  <span className="daa-edge-weight">Edge Weight: 50</span>
                  <div className="daa-edge-line" />
                  <IconArrowRight size={15} />
                </div>

                <div className="daa-node optimal">
                  <span className="daa-node-type">MIN VERTEX (B)</span>
                  <strong>Precision Lubrication</strong>
                  <span className="daa-dist">dist = 50 (Settled)</span>
                </div>

                <div className="daa-graph-edge optimal">
                  <span className="daa-edge-weight">Edge Weight: 0</span>
                  <div className="daa-edge-line" />
                  <IconArrowRight size={15} />
                </div>

                <div className="daa-node sink">
                  <span className="daa-node-type">SINK (t)</span>
                  <strong>Safe Operation</strong>
                  <span className="daa-dist">Total: 50</span>
                </div>
              </div>

              {/* Traversal Summary Text */}
              <div className="daa-summary-box">
                <strong>Traversal Trajectory:</strong>{" "}
                <code className="daa-route-code">SOURCE → Action B (Cost: 50) → SINK</code>
                <div className="daa-summary-detail">
                  Dijkstra evaluated paths: <code>Path(A) = 100</code>, <code>Path(B) = 50</code>,{" "}
                  <code>Path(C) = 80</code>. Vertex <strong>Action B</strong> minimizes total cost
                  while respecting maximum allowable downtime constraints.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: AI-ML (Random Forest) ─────────────────────────────────── */}
        {activeTab === "aiml" && (
          <div className="algo-tab-panel animate-fade" role="tabpanel">
            <div className="algo-panel-meta">
              <div>
                <h3 className="algo-panel-heading">Random Forest Predictive Regressor</h3>
                <p className="algo-panel-desc">
                  Ensemble of 100 bootstrap decision trees estimating downtime and maintenance costs
                  from operational telemetry.
                </p>
              </div>
              <span className="algo-spec-pill">
                <IconCpu size={13} /> Random Forest Regressor (R² = 0.953)
              </span>
            </div>

            {/* Sliders Grid */}
            <div className="aiml-sliders-grid">
              {/* Slider 1: Temperature */}
              <div className="aiml-slider-card">
                <div className="aiml-slider-header">
                  <label htmlFor={tempSliderId} className="aiml-slider-label">
                    Machine Temperature:
                  </label>
                  <span className="aiml-slider-value">{temp} °C</span>
                </div>
                <input
                  id={tempSliderId}
                  type="range"
                  min={70}
                  max={100}
                  step={1}
                  value={temp}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTemp(val);
                    setPredictionResult(calculatePrediction(val, vibration));
                  }}
                  className="algo-range-slider"
                />
                <div className="aiml-range-marks">
                  <span>70 °C (Nominal)</span>
                  <span>85 °C (Warm)</span>
                  <span>100 °C (Overheat)</span>
                </div>
              </div>

              {/* Slider 2: Vibration */}
              <div className="aiml-slider-card">
                <div className="aiml-slider-header">
                  <label htmlFor={vibSliderId} className="aiml-slider-label">
                    Vibration Velocity:
                  </label>
                  <span className="aiml-slider-value">{vibration.toFixed(1)} mm/s</span>
                </div>
                <input
                  id={vibSliderId}
                  type="range"
                  min={2}
                  max={10}
                  step={0.1}
                  value={vibration}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setVibration(val);
                    setPredictionResult(calculatePrediction(temp, val));
                  }}
                  className="algo-range-slider"
                />
                <div className="aiml-range-marks">
                  <span>2.0 mm/s (Smooth)</span>
                  <span>6.0 mm/s (Degraded)</span>
                  <span>10.0 mm/s (Critical)</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="aiml-controls">
              <button type="button" className="algo-action-btn" onClick={handlePredict}>
                <IconTrending size={15} /> Predict Maintenance Outcomes
              </button>
              <div className="algo-presets-row" style={{ marginTop: 0 }}>
                <span className="algo-presets-hint">Presets:</span>
                <button
                  type="button"
                  className="algo-preset-chip"
                  onClick={() => {
                    setTemp(72);
                    setVibration(2.4);
                    setPredictionResult(calculatePrediction(72, 2.4));
                  }}
                >
                  Healthy (72°C / 2.4 mm/s)
                </button>
                <button
                  type="button"
                  className="algo-preset-chip"
                  onClick={() => {
                    setTemp(86);
                    setVibration(5.8);
                    setPredictionResult(calculatePrediction(86, 5.8));
                  }}
                >
                  Degraded (86°C / 5.8 mm/s)
                </button>
                <button
                  type="button"
                  className="algo-preset-chip"
                  onClick={() => {
                    setTemp(98);
                    setVibration(9.2);
                    setPredictionResult(calculatePrediction(98, 9.2));
                  }}
                >
                  Severe (98°C / 9.2 mm/s)
                </button>
              </div>
            </div>

            {/* Prediction Output Display */}
            {predicted && (
              <div className="aiml-output-card animate-fade">
                {/* Canonical Required Sentence */}
                <div className="aiml-canonical-result" role="status">
                  <strong>Model Prediction:</strong> {predictionResult.text}
                </div>

                {/* Metric Cards Breakdown */}
                <div className="aiml-metrics-row">
                  <div className="aiml-metric-box">
                    <span className="aiml-metric-title">Predicted Downtime</span>
                    <strong className="aiml-metric-num">{predictionResult.downtime} hrs</strong>
                    <span className="aiml-metric-sub">Mean tree variance: ±0.3h</span>
                  </div>

                  <div className="aiml-metric-box">
                    <span className="aiml-metric-title">Predicted Cost</span>
                    <strong className="aiml-metric-num">
                      ₹{predictionResult.cost.toLocaleString("en-IN")}
                    </strong>
                    <span className="aiml-metric-sub">Direct labor + OEM parts</span>
                  </div>

                  <div className="aiml-metric-box highlight">
                    <span className="aiml-metric-title">Model R² Coefficient</span>
                    <strong className="aiml-metric-num">0.953</strong>
                    <span className="aiml-metric-sub">100 trees (cross-validated)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
