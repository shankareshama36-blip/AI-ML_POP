import {
  IconCheckCircle,
  IconShield,
  IconLayers,
  IconCpu,
  IconFileText,
  IconArrowRight,
  IconZap,
} from "./Icons";

export function AcademicEvidenceBoard() {
  return (
    <section
      className="aeb-container animate-fade"
      aria-label="Technical Evaluation Board: Subjects and Proofs"
    >
      <div className="aeb-header">
        <div className="aeb-badge">
          <IconZap size={13} />
          <span>Academic Evaluation Board</span>
        </div>
        <h2 className="aeb-title">
          Technical Evaluation Board: <span className="hero-title-gradient">Subjects &amp; Proofs</span>
        </h2>
        <p className="aeb-subtitle">
          Direct algorithmic mapping from academic curriculum to production source code. Instant static verification for faculty evaluation.
        </p>
      </div>

      <div className="aeb-grid">
        {/* ── CARD 1: FLAT ──────────────────────────────────────────────── */}
        <article className="aeb-card aeb-card-flat">
          <div className="aeb-card-glow" aria-hidden="true" />
          <div className="aeb-card-header">
            <div className="aeb-subject-chip flat">
              <IconShield size={14} />
              <span>FLAT (Formal Languages)</span>
            </div>
            <span className="aeb-status-pill">
              <IconCheckCircle size={12} /> Verified
            </span>
          </div>

          <div className="aeb-card-body">
            <div className="aeb-badge-row">
              <span className="aeb-algo-badge flat">DFA Validation</span>
            </div>
            <h3 className="aeb-card-title">Deterministic Finite Automaton</h3>
            <p className="aeb-card-desc">
              Deterministic Finite Automaton validating system state.
            </p>

            <div className="aeb-code-block">
              <div className="aeb-code-header">
                <IconFileText size={13} />
                <span>CODE LOCATION</span>
              </div>
              <code className="aeb-code-path">backend/app/formal_engine.py</code>
            </div>

            <div className="aeb-proof-box">
              <div className="aeb-proof-title">PROOF VISUAL &bull; STATE TRANSITION GRAPH</div>
              <div className="aeb-dfa-flow" aria-label="DFA Transition Path: START to VALID to ACCEPT">
                <div className="aeb-dfa-node start">
                  <span className="aeb-dfa-node-label">START</span>
                  <span className="aeb-dfa-node-sub">q₀</span>
                </div>

                <div className="aeb-dfa-arrow">
                  <span className="aeb-dfa-edge-label">&delta;(telemetry)</span>
                  <IconArrowRight size={14} className="aeb-dfa-arrow-icon" />
                </div>

                <div className="aeb-dfa-node valid">
                  <span className="aeb-dfa-node-label">VALID</span>
                  <span className="aeb-dfa-node-sub">q₁</span>
                </div>

                <div className="aeb-dfa-arrow">
                  <span className="aeb-dfa-edge-label">&delta;(priority)</span>
                  <IconArrowRight size={14} className="aeb-dfa-arrow-icon" />
                </div>

                {/* Final Accepting State: Double ring convention in Automata Theory */}
                <div className="aeb-dfa-node accept">
                  <span className="aeb-dfa-node-label">ACCEPT</span>
                  <span className="aeb-dfa-node-sub">q₂ &isin; F</span>
                </div>
              </div>
              <div className="aeb-proof-caption">
                Formal 5-tuple machine $M = (Q, \Sigma, \delta, q_0, F)$ executing $O(1)$ state transitions.
              </div>
            </div>
          </div>
        </article>

        {/* ── CARD 2: DAA ───────────────────────────────────────────────── */}
        <article className="aeb-card aeb-card-daa">
          <div className="aeb-card-glow" aria-hidden="true" />
          <div className="aeb-card-header">
            <div className="aeb-subject-chip daa">
              <IconLayers size={14} />
              <span>DAA (Algorithms)</span>
            </div>
            <span className="aeb-status-pill">
              <IconCheckCircle size={12} /> Optimized
            </span>
          </div>

          <div className="aeb-card-body">
            <div className="aeb-badge-row">
              <span className="aeb-algo-badge daa">Dijkstra Optimization</span>
            </div>
            <h3 className="aeb-card-title">Graph Cost Minimization</h3>
            <p className="aeb-card-desc">
              Graph-based shortest path for decision cost minimization.
            </p>

            <div className="aeb-code-block">
              <div className="aeb-code-header">
                <IconFileText size={13} />
                <span>CODE LOCATION</span>
              </div>
              <code className="aeb-code-path">backend/app/decision_engine.py</code>
            </div>

            <div className="aeb-proof-box">
              <div className="aeb-proof-title">PROOF VISUAL &bull; OBJECTIVE FUNCTION</div>
              <div className="aeb-formula-box">
                <div className="aeb-formula-line">
                  <span className="aeb-formula-lhs">Score</span>
                  <span className="aeb-formula-op">=</span>
                  <span className="aeb-formula-token cost">Cost</span>
                  <span className="aeb-formula-op">+</span>
                  <span className="aeb-formula-token downtime">(Downtime &times; Rate)</span>
                  <span className="aeb-formula-op">+</span>
                  <span className="aeb-formula-token risk">(Risk &times; Factor)</span>
                </div>
              </div>
              <div className="aeb-proof-caption">
                Single-source shortest path via min-priority heap in $O((V + E) \log V)$ time complexity.
              </div>
            </div>
          </div>
        </article>

        {/* ── CARD 3: AI-ML ─────────────────────────────────────────────── */}
        <article className="aeb-card aeb-card-aiml">
          <div className="aeb-card-glow" aria-hidden="true" />
          <div className="aeb-card-header">
            <div className="aeb-subject-chip aiml">
              <IconCpu size={14} />
              <span>AI-ML (Machine Learning)</span>
            </div>
            <span className="aeb-status-pill">
              <IconCheckCircle size={12} /> Trained
            </span>
          </div>

          <div className="aeb-card-body">
            <div className="aeb-badge-row">
              <span className="aeb-algo-badge aiml">Random Forest</span>
            </div>
            <h3 className="aeb-card-title">Ensemble Predictive Modeling</h3>
            <p className="aeb-card-desc">
              Predictive modeling for downtime and risk.
            </p>

            <div className="aeb-code-block">
              <div className="aeb-code-header">
                <IconFileText size={13} />
                <span>CODE LOCATION</span>
              </div>
              <code className="aeb-code-path">backend/app/prediction/model.py</code>
            </div>

            <div className="aeb-proof-box">
              <div className="aeb-proof-title">PROOF VISUAL &bull; BENCHMARKED METRICS</div>
              <div className="aeb-metrics-grid">
                <div className="aeb-metric-card highlight">
                  <span className="aeb-metric-label">REGRESSION ACCURACY</span>
                  <span className="aeb-metric-val">R&sup2; = 0.953</span>
                  <span className="aeb-metric-sub">Downtime &amp; Cost Fit</span>
                </div>
                <div className="aeb-metric-card">
                  <span className="aeb-metric-label">CLASSIFIER ACCURACY</span>
                  <span className="aeb-metric-val">89.5%</span>
                  <span className="aeb-metric-sub">Risk Level Precision</span>
                </div>
              </div>
              <div className="aeb-proof-caption">
                Scikit-Learn ensemble trained on industrial telemetry: 100 estimators, max depth 12.
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
