import {
  IconTrending,
  IconShield,
  IconCheckCircle,
  IconArrowRight,
  IconWrench,
  IconClipboard,
  IconClock,
  IconSearch,
  IconLayers,
  IconCpu,
} from "../components/Icons";

interface LandingPageProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

export function LandingPage({ onSignIn, onGetStarted }: LandingPageProps) {
  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="landing-page animate-fade">
      {/* 1. NAV BAR */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          AM<span>&</span>POP
        </div>
        <button
          type="button"
          className="landing-nav-btn"
          onClick={onSignIn}
          aria-label="Sign in to AM&POP"
        >
          Sign In
        </button>
      </nav>

      {/* 2. HERO SECTION */}
      <header className="hero">
        <div className="hero-badge">Decision Intelligence Platform</div>
        <h1 className="hero-title">
          AI can act. <span>AM&amp;POP decides.</span>
        </h1>
        <p className="hero-subtitle">
          AM&amp;POP unites formal language verification, machine learning, and
          graph optimization to govern autonomous industrial operations. Rather
          than just predicting failures, AM&amp;POP selects the optimal feasible
          action and enforces strict human-in-the-loop authorization chains.
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="btn-primary btn-lg"
            onClick={onGetStarted}
          >
            Get Started <IconArrowRight size={16} />
          </button>
          <button
            type="button"
            className="btn-ghost btn-lg"
            onClick={() => scrollToSection("what-is")}
          >
            Learn More
          </button>
        </div>
      </header>

      {/* 3. WHAT IS AM&POP */}
      <section id="what-is" className="section">
        <div className="section-head">
          <h2 className="section-title">What is AM&amp;POP?</h2>
          <p className="section-sub">
            A full-lifecycle decision intelligence engine designed for
            mission-critical industrial and factory workflows.
          </p>
        </div>
        <div className="grid-3">
          <div className="feature-card">
            <div className="feature-icon">
              <IconTrending size={20} />
            </div>
            <h3 className="feature-title">Evaluates Possibilities</h3>
            <p className="feature-desc">
              Trained scikit-learn models predict downtime, economic cost, and
              operational risk across all candidate maintenance actions based on
              live telemetry.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconShield size={20} />
            </div>
            <h3 className="feature-title">Enforces Constraints</h3>
            <p className="feature-desc">
              Deterministic finite automata and hard operational boundary checks
              guarantee that unsafe, out-of-budget, or unfeasible actions are
              eliminated before selection.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconCheckCircle size={20} />
            </div>
            <h3 className="feature-title">Approves Safely</h3>
            <p className="feature-desc">
              Calculated financial exposure and operational criticality route
              decisions through multi-tier human-in-the-loop authorizations
              before execution.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (The Decision Loop) */}
      <section id="decision-loop" className="section">
        <div className="section-head">
          <h2 className="section-title">The Decision Loop</h2>
          <p className="section-sub">
            From raw telemetry to authorized resolution across seven
            mathematically verified stages.
          </p>
        </div>
        <div className="loop">
          <div className="loop-step">
            <div className="loop-num">1</div>
            <div className="loop-label">INPUT</div>
            <div className="feature-desc" style={{ fontSize: "11px", textAlign: "center" }}>
              Machine telemetry
            </div>
          </div>
          <IconArrowRight size={14} className="loop-arrow" />

          <div className="loop-step">
            <div className="loop-num">2</div>
            <div className="loop-label">VALIDATION</div>
            <div className="feature-desc" style={{ fontSize: "11px", textAlign: "center" }}>
              5-state DFA check
            </div>
          </div>
          <IconArrowRight size={14} className="loop-arrow" />

          <div className="loop-step">
            <div className="loop-num">3</div>
            <div className="loop-label">STATE</div>
            <div className="feature-desc" style={{ fontSize: "11px", textAlign: "center" }}>
              Health classification
            </div>
          </div>
          <IconArrowRight size={14} className="loop-arrow" />

          <div className="loop-step">
            <div className="loop-num">4</div>
            <div className="loop-label">ACTIONS</div>
            <div className="feature-desc" style={{ fontSize: "11px", textAlign: "center" }}>
              Action vocabulary
            </div>
          </div>
          <IconArrowRight size={14} className="loop-arrow" />

          <div className="loop-step">
            <div className="loop-num">5</div>
            <div className="loop-label">PREDICTION</div>
            <div className="feature-desc" style={{ fontSize: "11px", textAlign: "center" }}>
              RandomForest ML
            </div>
          </div>
          <IconArrowRight size={14} className="loop-arrow" />

          <div className="loop-step">
            <div className="loop-num">6</div>
            <div className="loop-label">OPTIMIZATION</div>
            <div className="feature-desc" style={{ fontSize: "11px", textAlign: "center" }}>
              Dijkstra algorithm
            </div>
          </div>
          <IconArrowRight size={14} className="loop-arrow" />

          <div className="loop-step">
            <div className="loop-num">7</div>
            <div className="loop-label">DECISION</div>
            <div className="feature-desc" style={{ fontSize: "11px", textAlign: "center" }}>
              Human approval gate
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURES GRID */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Built for Real Decisions</h2>
          <p className="section-sub">
            Enterprise-grade architecture connecting formal language theory, AI
            prediction, and graph algorithms.
          </p>
        </div>
        <div className="grid-3">
          <div className="feature-card">
            <div className="feature-icon">
              <IconShield size={20} />
            </div>
            <h3 className="feature-title">1. DFA Validation (FLAT)</h3>
            <p className="feature-desc">
              Guarantees request syntax, equipment identifiers, and vocabulary
              adherence before any computational or ML resources are spent.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconTrending size={20} />
            </div>
            <h3 className="feature-title">2. ML Prediction (RandomForest)</h3>
            <p className="feature-desc">
              Three offline-trained models estimate downtime (R²=0.953),
              repair cost (R²=0.857), and risk category (accuracy=0.895).
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconCpu size={20} />
            </div>
            <h3 className="feature-title">3. Dijkstra Optimization (DAA)</h3>
            <p className="feature-desc">
              Solves the single-source shortest path problem across candidate
              action edges to pick the global cost-downtime-risk minimum.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconLayers size={20} />
            </div>
            <h3 className="feature-title">4. Multi-Level Approval</h3>
            <p className="feature-desc">
              Cost-based escalation chain dynamically requiring technician,
              supervisor, and plant manager signatures based on financial scope.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconSearch size={20} />
            </div>
            <h3 className="feature-title">5. Decision Explanation Modal</h3>
            <p className="feature-desc">
              Provides mathematical transparency decomposing constraint limits,
              heuristic scoring formulas, and discarded alternative candidates.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconClock size={20} />
            </div>
            <h3 className="feature-title">6. Real-Time Audit Trail</h3>
            <p className="feature-desc">
              Maintains an immutable lifecycle record tracking every stage from
              intake to supervisor decision and experience-memory retraining.
            </p>
          </div>
        </div>
      </section>

      {/* 6. ACADEMIC MAPPING */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Academic Foundation</h2>
          <p className="section-sub">
            Rigorous grounding in foundational computer science curricula.
          </p>
        </div>
        <div className="grid-3">
          <div className="feature-card">
            <div className="feature-icon">
              <IconShield size={20} />
            </div>
            <h3 className="feature-title">FLAT — Formal Languages</h3>
            <p className="feature-desc" style={{ marginBottom: "8px", color: "var(--brand)", fontWeight: 600 }}>
              Deterministic Finite Automaton
            </p>
            <p className="feature-desc">
              Implemented as an explicit 5-state automaton validating input symbols
              prior to decision evaluation, ensuring structural correctness.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconTrending size={20} />
            </div>
            <h3 className="feature-title">AI / ML — Predictive Modeling</h3>
            <p className="feature-desc" style={{ marginBottom: "8px", color: "var(--brand)", fontWeight: 600 }}>
              RandomForest Regressors &amp; Classifier
            </p>
            <p className="feature-desc">
              Trained on 20,000 synthetic physics-derived telemetry rows to
              deliver robust predictions under non-linear operational dynamics.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <IconCpu size={20} />
            </div>
            <h3 className="feature-title">DAA — Algorithms &amp; Analysis</h3>
            <p className="feature-desc" style={{ marginBottom: "8px", color: "var(--brand)", fontWeight: 600 }}>
              Dijkstra Shortest Path
            </p>
            <p className="feature-desc">
              Graph optimization evaluating multi-objective action surfaces to
              prove greedy choice optimality and bound decision time complexity.
            </p>
          </div>
        </div>
      </section>

      {/* 7. ROLES */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Built for the Whole Team</h2>
          <p className="section-sub">
            Role-tailored interfaces for factory floor specialists and
            operational leadership.
          </p>
        </div>
        <div className="grid-4">
          <div className="feature-card" style={{ textAlign: "center" }}>
            <div className="feature-icon" style={{ margin: "0 auto 16px" }}>
              <IconWrench size={20} />
            </div>
            <h3 className="feature-title">Technician</h3>
            <p className="feature-desc">
              Reports equipment issues and monitors live resolution status.
            </p>
          </div>

          <div className="feature-card" style={{ textAlign: "center" }}>
            <div className="feature-icon" style={{ margin: "0 auto 16px" }}>
              <IconClipboard size={20} />
            </div>
            <h3 className="feature-title">Maint Supervisor</h3>
            <p className="feature-desc">
              Triggers AI optimization and approves tier-1 maintenance actions.
            </p>
          </div>

          <div className="feature-card" style={{ textAlign: "center" }}>
            <div className="feature-icon" style={{ margin: "0 auto 16px" }}>
              <IconTrending size={20} />
            </div>
            <h3 className="feature-title">Prod Supervisor</h3>
            <p className="feature-desc">
              Balances line throughput and authorizes intermediate cost plans.
            </p>
          </div>

          <div className="feature-card" style={{ textAlign: "center" }}>
            <div className="feature-icon" style={{ margin: "0 auto 16px" }}>
              <IconShield size={20} />
            </div>
            <h3 className="feature-title">Plant Manager</h3>
            <p className="feature-desc">
              Final executive safety and financial sign-off for critical interventions.
            </p>
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="cta-final">
        <h2>Ready to make better decisions?</h2>
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="btn-primary btn-lg"
            onClick={onSignIn}
          >
            Sign In to AM&amp;POP <IconArrowRight size={16} />
          </button>
        </div>
        <p className="feature-desc" style={{ fontSize: "13px" }}>
          Demo credentials available directly on the login page
        </p>
      </section>

      {/* 9. FOOTER */}
      <footer className="landing-footer">
        <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
          AM&amp;POP — Decision Intelligence for Autonomous Operations
        </p>
        <div style={{ margin: "12px 0" }}>
          <a
            href="https://github.com/shankareshama36-blip/AI-ML_POP"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span>·</span>
          <a href="#what-is" onClick={(e) => { e.preventDefault(); scrollToSection("what-is"); }}>
            Platform Docs
          </a>
          <span>·</span>
          <a href="#decision-loop" onClick={(e) => { e.preventDefault(); scrollToSection("decision-loop"); }}>
            System Architecture
          </a>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          &copy; {new Date().getFullYear()} AM&amp;POP Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
