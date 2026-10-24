import { useEffect, useState, type ComponentType } from "react";
import {
  IconArrowRight, IconCheckCircle, IconClipboard, IconClock,
  IconCpu, IconLayers, IconSearch, IconShield, IconTrending, IconWrench,
} from "../components/Icons";
import { Logo } from "../components/Logo";

interface LandingPageProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

type Icon = ComponentType<{ size?: number; className?: string }>;

const features: Array<{ title: string; description: string; icon: Icon }> = [
  { title: "Evaluates possibilities", description: "Compare every viable maintenance action against operational cost, downtime, and risk.", icon: IconTrending },
  { title: "Enforces constraints", description: "Eliminate unsafe, out-of-budget, and infeasible plans before a recommendation reaches a person.", icon: IconShield },
  { title: "Approves safely", description: "Route decisions through accountable, cost-aware approval chains with a complete audit history.", icon: IconCheckCircle },
  { title: "Explains every choice", description: "Make recommendations inspectable with transparent scores, constraints, and rejected alternatives.", icon: IconSearch },
  { title: "Optimizes globally", description: "Balance competing objectives with a graph-based optimization layer instead of one-dimensional alerts.", icon: IconLayers },
  { title: "Learns from outcomes", description: "Turn completed work into a durable experience record for continuous operational improvement.", icon: IconCpu },
];

const loop = [
  ["Input", "Machine telemetry"],
  ["Validate", "DFA guardrails"],
  ["Model", "State assessment"],
  ["Explore", "Action options"],
  ["Predict", "ML outcomes"],
  ["Optimize", "Best feasible path"],
  ["Approve", "Human decision"],
];

const roles: Array<{ title: string; description: string; icon: Icon; level: number }> = [
  { title: "Technician", description: "Report and track issues on the factory floor.", icon: IconWrench, level: 1 },
  { title: "Maintenance Supervisor", description: "Evaluate maintenance actions and approve first-line work.", icon: IconClipboard, level: 2 },
  { title: "Production Supervisor", description: "Balance intervention plans with throughput commitments.", icon: IconTrending, level: 3 },
  { title: "Plant Manager", description: "Provide final safety and financial accountability.", icon: IconShield, level: 4 },
];

export function LandingPage({ onSignIn, onGetStarted }: LandingPageProps) {
  const [decisionCount, setDecisionCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const base = import.meta.env.VITE_API_BASE_URL || "/api";
    void fetch(`${base}/analytics/decisions-count`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ count?: number }> : { count: 0 })
      .then((data) => setDecisionCount(Number.isFinite(data.count) ? data.count ?? 0 : 0))
      .catch(() => setDecisionCount(0));
    return () => controller.abort();
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="landing-page animate-fade">
      <nav className="landing-nav" aria-label="Primary navigation">
        <button type="button" className="landing-nav-logo" onClick={() => scrollTo("top")} aria-label="Praxis home"><Logo /></button>
        <div className="landing-nav-actions">
          <button type="button" className="nav-signin" onClick={onSignIn}>Sign in</button>
          <button type="button" className="landing-nav-btn" onClick={onGetStarted}>Get Started Free <IconArrowRight size={14} /></button>
        </div>
      </nav>

      <header id="top" className="hero hero-premium">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-badge">Decision intelligence for operations</div>
            <h1 className="hero-title">AI can act. <span>Praxis decides.</span></h1>
            <p className="hero-subtitle">Praxis validates conditions, models trade-offs, and routes the safest feasible action to the right decision-maker.</p>
            <div className="hero-actions">
              <button type="button" className="btn-primary btn-lg" onClick={onGetStarted}>Explore the platform <IconArrowRight size={16} /></button>
              <button type="button" className="btn-ghost btn-lg" onClick={() => scrollTo("how")}>See the decision loop</button>
            </div>
            <div className="hero-proof" aria-label="Platform capabilities">
              <span><IconCheckCircle size={14} /> Formal validation</span>
              <span><IconTrending size={14} /> ML predictions</span>
              <span><IconClipboard size={14} /> Human approval</span>
            </div>
          </div>

          <div className="decision-showcase" aria-label="Example Praxis decision">
            <div className="floating-card floating-valid"><IconCheckCircle size={14} /> DFA valid</div>
            <div className="floating-card floating-constraints"><IconShield size={14} /> 3 constraints satisfied</div>
            <article className="decision-panel">
              <div className="decision-panel-top">
                <div><p className="panel-kicker">Live decision brief</p><h2>CNC-07</h2></div>
                <span className="attention-badge"><i /> Attention required</span>
              </div>
              <div className="decision-metrics">
                <div><span>Predicted downtime</span><strong>2.4 hrs</strong></div>
                <div><span>Expected cost</span><strong>₹18,400</strong></div>
                <div><span>Risk level</span><strong className="risk-medium">Managed</strong></div>
              </div>
              <div className="recommendation">
                <div className="recommendation-icon"><IconWrench size={18} /></div>
                <div><span>Recommended action</span><strong>Schedule controlled repair</strong></div>
                <span className="confidence">94% confidence</span>
              </div>
              <div className="approval-path">
                <span>Approval path</span>
                <div><b>Maintenance</b><i /><b>Production</b><i /><b>Plant lead</b></div>
              </div>
            </article>
            <div className="floating-card floating-audit"><IconClipboard size={14} /> Audit trail ready</div>
          </div>
        </div>
      </header>

      <section className="trust-bar" aria-label="Platform capabilities">
        <span><strong>7-stage</strong> decision loop</span><i /> <span><strong>Constraint-aware</strong> recommendations</span><i /> <span><strong>Complete</strong> audit trail</span>
      </section>

      <section className="section" aria-labelledby="what-title">
        <div className="section-head"><p className="eyebrow">A decision layer, not another dashboard</p><h2 id="what-title" className="section-title">What is Praxis?</h2><p className="section-sub">A full-lifecycle decision system for high-consequence industrial workflows.</p></div>
        <div className="grid-3">{features.slice(0, 3).map(({ title, description, icon: FeatureIcon }) => <article className="feature-card" key={title}><div className="feature-icon"><FeatureIcon size={23} /></div><h3 className="feature-title">{title}</h3><p className="feature-desc">{description}</p></article>)}</div>
      </section>

      <section id="how" className="section section-contrast" aria-labelledby="how-title">
        <div className="section-head"><p className="eyebrow">From signal to accountable action</p><h2 id="how-title" className="section-title">The Decision Loop</h2><p className="section-sub">Seven deliberate stages turn raw conditions into an authorized operational choice.</p></div>
        <div className="loop">{loop.map(([label, detail], index) => <div className="loop-fragment" key={label}><article className="loop-step"><span className="loop-num">{index + 1}</span><strong className="loop-label">{label}</strong><span className="loop-detail">{detail}</span></article>{index < loop.length - 1 && <IconArrowRight size={18} className="loop-arrow" aria-hidden="true" />}</div>)}</div>
      </section>

      <section id="features" className="section" aria-labelledby="features-title">
        <div className="section-head"><p className="eyebrow">Designed for real operating conditions</p><h2 id="features-title" className="section-title">Built for Real Decisions</h2><p className="section-sub">A rigorous foundation for decisions that need to be safe, explainable, and auditable.</p></div>
        <div className="grid-3">{features.map(({ title, description, icon: FeatureIcon }) => <article className="feature-card" key={title}><div className="feature-icon"><FeatureIcon size={23} /></div><h3 className="feature-title">{title}</h3><p className="feature-desc">{description}</p></article>)}</div>
      </section>

      <section id="academic" className="section section-contrast" aria-labelledby="academic-title">
        <div className="section-head"><p className="eyebrow">Technical rigor by design</p><h2 id="academic-title" className="section-title">Academic Foundation</h2><p className="section-sub">Three disciplines working together to make choices reliable under pressure.</p></div>
        <div className="academic-grid">
          <article className="academic-card flat"><span className="subject-badge">FLAT</span><h3>Formal language validation</h3><p>A deterministic finite automaton validates every request before it reaches the decision engine. Invalid states stop early, predictably, and with a traceable reason.</p></article>
          <article className="academic-card aiml"><span className="subject-badge">AI-ML</span><h3>Predictive modeling</h3><p>Offline-trained models estimate downtime, cost, and risk for each candidate action. Predictions remain inputs to a governed decision, never an unchecked command.</p></article>
          <article className="academic-card daa"><span className="subject-badge">DAA</span><h3>Graph optimization</h3><p>Shortest-path optimization compares feasible choices over a multi-objective cost surface. The result is the globally lowest-scoring action that still satisfies hard constraints.</p></article>
        </div>
      </section>

      <section id="team" className="section" aria-labelledby="team-title">
        <div className="section-head"><p className="eyebrow">One shared source of operational truth</p><h2 id="team-title" className="section-title">Built for the Whole Team</h2><p className="section-sub">Purpose-built views support each level of responsibility without losing the decision context.</p></div>
        <div className="role-grid">{roles.map(({ title, description, icon: RoleIcon, level }) => <article className="role-card" key={title}><div className="role-top"><RoleIcon size={22} /><span className="role-level" aria-label={`Approval level ${level}`}>{Array.from({ length: level }, (_, index) => <i key={index} />)}</span></div><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="cta-final" aria-labelledby="cta-title">
        <h2 id="cta-title">Start making smarter operational decisions</h2>
        <p>Bring formal validation, predictive insight, and accountable approvals into one operational workflow.</p>
        <div className="counter-badge" aria-label="Live decisions count">
          <IconClock size={14} />
          <span>{decisionCount.toLocaleString()} decisions made</span>
        </div>
        <div>
          <button type="button" className="btn-primary cta-button" onClick={onGetStarted}>
            Get Started Free <IconArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-grid"><div className="footer-brand"><Logo /><p>Decision intelligence for autonomous operations.</p></div><div><h3>Product</h3><a href="#features">Capabilities</a><a href="#how">Decision loop</a><a href="#team">Roles</a></div><div><h3>Docs</h3><a href="#academic">Methodology</a><a href="#how">System architecture</a><a href="#features">Security</a></div><div><h3>Company</h3><a href="#top">About</a><a href="#top">Contact</a><a href="#top">Legal</a></div></div>
        <div className="footer-bottom"><span>© 2026 Praxis Platform. All rights reserved.</span><span>Built for accountable operations.</span></div>
      </footer>
    </div>
  );
}
