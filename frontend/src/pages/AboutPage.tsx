import {
  IconShield,
  IconCheckCircle,
  IconLock,
  IconCpu,
  IconTrending,
  IconLayers,
  IconArrowRight,
} from "../components/Icons";
import type { PublicView } from "../components/LandingLayout";

interface AboutPageProps {
  onNavigate: (view: PublicView) => void;
  onGetStarted: () => void;
}

export function AboutPage({ onNavigate, onGetStarted }: AboutPageProps) {
  return (
    <div className="about-page animate-fade">
      {/* Hero Section */}
      <header className="about-hero">
        <div className="hero-badge">Trust & Decision Integrity</div>
        <h1 className="about-hero-title">Why Trust Praxis?</h1>
        <p className="about-hero-subtitle">
          We don't just provide AI. We provide auditable, constraint-checked decision intelligence.
        </p>
        <div className="trust-badge-row">
          <div className="trust-pill">
            <IconShield size={14} /> DFA Formal Guardrails
          </div>
          <div className="trust-pill">
            <IconLock size={14} /> Cryptographic RBAC & Tokens
          </div>
          <div className="trust-pill">
            <IconCheckCircle size={14} /> Multi-Tier Human Authorization
          </div>
        </div>
      </header>

      {/* Section 1: The Praxis Advantage for Consumers */}
      <section className="about-section" aria-labelledby="advantage-title">
        <div className="section-head">
          <p className="eyebrow">Rigorous Foundations</p>
          <h2 id="advantage-title" className="section-title">
            The Praxis Advantage for Consumers
          </h2>
          <p className="section-sub">
            Operational recommendations must never be hallucinations. Unlike generative or black-box
            LLMs that produce uncontrolled stochastic outputs, Praxis enforces strict mathematical
            and algorithmic guarantees.
          </p>
        </div>

        <div className="about-grid">
          <article className="about-card">
            <div className="about-card-icon">
              <IconShield size={22} />
            </div>
            <h3>Deterministic Finite Automaton (DFA)</h3>
            <p>
              Every maintenance request must pass a formally verified state machine before any
              predictive analysis begins. If telemetry parameters (temperature, vibration, pressure)
              fall outside provably safe physical envelopes, the DFA intercepts and stops the
              evaluation early with an immutable, traceable reason.
            </p>
            <ul className="about-feature-list">
              <li>Formal state transition guarantees (FLAT)</li>
              <li>Zero execution on invalid or corrupt sensor inputs</li>
              <li>Pre-evaluation rejection of out-of-spec operational requests</li>
            </ul>
          </article>

          <article className="about-card">
            <div className="about-card-icon">
              <IconLayers size={22} />
            </div>
            <h3>Dijkstra Multidimensional Optimization</h3>
            <p>
              Candidate operational actions are mapped onto a weighted directed graph where edge
              weights encode financial cost, production downtime, and safety risk. Dijkstra's shortest
              path algorithm computes the mathematically provable globally optimal feasible action,
              rather than an arbitrary heuristic.
            </p>
            <ul className="about-feature-list">
              <li>Multi-objective Pareto-cost surface evaluation</li>
              <li>Hard operational constraints (budget & downtime limits)</li>
              <li>Auditable ranking of all candidate interventions</li>
            </ul>
          </article>

          <article className="about-card">
            <div className="about-card-icon">
              <IconCpu size={22} />
            </div>
            <h3>Governed Predictive Models</h3>
            <p>
              Trained scikit-learn ensemble models estimate financial expenses and downtime hours
              based on real machine wear telemetry. Predictions are treated as bounded inputs to the
              governance layer—never as automated commands that execute without human oversight.
            </p>
            <ul className="about-feature-list">
              <li>Bounded confidence scores for each candidate action</li>
              <li>Continuous calibration against historical factory outcomes</li>
              <li>Complete isolation from untrusted external training loops</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Section 2: Data Security & Trust */}
      <section className="about-section section-contrast" aria-labelledby="security-title">
        <div className="section-head">
          <p className="eyebrow">Enterprise Defense in Depth</p>
          <h2 id="security-title" className="section-title">
            Data Security & Trust
          </h2>
          <p className="section-sub">
            Your factory data represents critical intellectual property. We protect telemetry,
            decisions, and credentials with enterprise-grade cryptographic controls.
          </p>
        </div>

        <div className="security-cards-grid">
          <div className="security-card">
            <div className="security-icon-wrap">
              <IconLock size={20} />
            </div>
            <div>
              <h4>End-to-End Encryption</h4>
              <p>
                All network traffic is encrypted via TLS 1.3 with HSTS enforcement. Persistent records
                in our durable data store utilize AES-256 encryption at rest, guaranteeing tenant
                isolation and tamper prevention.
              </p>
            </div>
          </div>

          <div className="security-card">
            <div className="security-icon-wrap">
              <IconShield size={20} />
            </div>
            <div>
              <h4>Strict JWT Token Validation</h4>
              <p>
                User sessions use cryptographically signed HMAC-SHA256 JWT tokens with strict
                expiration policies, server-side revocation checks, and automatic protection against
                session hijacking and replay attacks.
              </p>
            </div>
          </div>

          <div className="security-card">
            <div className="security-icon-wrap">
              <IconTrending size={20} />
            </div>
            <div>
              <h4>Multi-Tier Role-Based Access Control (RBAC)</h4>
              <p>
                Strict authorization boundaries ensure that only designated supervisors can approve
                actions. Tier 1 maintenance approvals (&lt;$10k) stay with Maintenance Supervisors, while
                major interventions ($10k-$50k) require Production Supervisors, and critical capital
                expenditures (≥$50k) require Plant Manager sign-off.
              </p>
            </div>
          </div>

          <div className="security-card">
            <div className="security-icon-wrap">
              <IconCheckCircle size={20} />
            </div>
            <div>
              <h4>Immutable Audit Trails</h4>
              <p>
                Every decision loop, model prediction, rejected alternative, and supervisor approval is
                written to an append-only audit trail with UTC timestamps, user identity stamps, and
                recorded condition remarks for regulatory compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Our Mission */}
      <section className="about-section" aria-labelledby="mission-title">
        <div className="mission-container">
          <p className="eyebrow">Purpose & Direction</p>
          <h2 id="mission-title" className="mission-title">
            Our Mission
          </h2>
          <p className="mission-quote">
            "To bring accountable, transparent AI to operational teams worldwide."
          </p>
          <p className="mission-body">
            Modern industry is caught between rigid legacy spreadsheets and unaccountable black-box AI
            models that hallucinate or act unpredictably. Praxis was founded on the principle that
            operational intelligence must be <strong>inspectable</strong>, <strong>bounded</strong>,
            and <strong>accountable</strong>.
          </p>
          <p className="mission-body">
            By unifying formal language verification (FLAT), shortest-path optimization (DAA), and
            calibrated predictive modeling (AI-ML), we empower frontline technicians and senior plant
            executives to make safe, mathematically sound decisions together.
          </p>
        </div>
      </section>

      {/* Trust CTA */}
      <section className="cta-final" aria-labelledby="cta-about-title">
        <h2 id="cta-about-title">Experience Verified Decision Intelligence</h2>
        <p>
          See how Praxis transforms equipment complaints and machine anomalies into provably safe,
          auditable interventions.
        </p>
        <div className="about-cta-actions">
          <button type="button" className="btn-primary cta-button" onClick={onGetStarted}>
            Get Started Free <IconArrowRight size={18} />
          </button>
          <button
            type="button"
            className="btn-ghost cta-button-secondary"
            onClick={() => onNavigate("contact")}
          >
            Contact Enterprise Sales
          </button>
        </div>
      </section>
    </div>
  );
}
