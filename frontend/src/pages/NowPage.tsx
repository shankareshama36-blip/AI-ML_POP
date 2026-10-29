import { useState, useEffect } from "react";
import { type PublicView } from "../components/LandingLayout";
import {
  IconArrowRight,
  IconClock,
} from "../components/Icons";

interface NowPageProps {
  onNavigate?: (view: PublicView) => void;
  onGetStarted: () => void;
}

const SECTIONS = [
  { id: "prologue", title: "Prologue: The Crisis of Probabilistic Automation" },
  { id: "philosophy", title: "Chapter I: The Praxis Philosophy of Governance" },
  { id: "dfa-engine", title: "Chapter II: Formal Verification & Deterministic Automata" },
  { id: "dijkstra-graph", title: "Chapter III: Graph Optimization & Pareto Frontiers" },
  { id: "cryptographic-isolation", title: "Chapter IV: Zero-Leak Multi-Tenancy & Ledgers" },
  { id: "ani-paradigm", title: "Chapter V: The ANI Paradigm vs. General Hallucination" },
  { id: "industry-manufacturing", title: "Chapter VI: Industrial Manufacturing & Industry 4.0" },
  { id: "industry-healthcare", title: "Chapter VII: Healthcare & Clinical Safety Protocols" },
  { id: "industry-finance", title: "Chapter VIII: Quantitative Finance & Risk Defense" },
  { id: "industry-aerospace", title: "Chapter IX: Aerospace, Energy Grids & Defense" },
  { id: "mathematical-proofs", title: "Chapter X: Formal Proofs & State Matrices" },
  { id: "roadmap-2030", title: "Chapter XI: The 2026–2030 Universal Operations Roadmap" },
];

export function NowPage({ onNavigate, onGetStarted }: NowPageProps) {
  const [activeSection, setActiveSection] = useState("prologue");
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setReadingProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }

      const offsets = SECTIONS.map((sec) => {
        const el = document.getElementById(sec.id);
        return {
          id: sec.id,
          top: el ? el.getBoundingClientRect().top : 10000,
        };
      });

      const current = offsets.filter((s) => s.top <= 200).pop();
      if (current) {
        setActiveSection(current.id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="now-page animate-fade" style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 20px 100px", color: "#e2e8f0" }}>
      {/* Reading Progress Bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "3px",
          width: `${readingProgress}%`,
          background: "linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)",
          zIndex: 1000,
          transition: "width 0.1s linear",
        }}
      />

      {/* Hero Header */}
      <div style={{ textAlign: "center", marginBottom: "64px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "48px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 16px",
            borderRadius: "999px",
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            color: "#38bdf8",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          <IconClock size={14} color="#38bdf8" />
          The Praxis Manifesto • 32 Min Read • October 2026 Edition
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 5.5vw, 64px)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.035em",
            color: "#f8fafc",
            maxWidth: "960px",
            margin: "0 auto 24px",
          }}
        >
          Autonomous Operations & The{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 45%, #f472b6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Formal Verification
          </span>{" "}
          Imperative
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#94a3b8",
            maxWidth: "760px",
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          A comprehensive blueprint for high-stakes decision intelligence, deterministic state machines,
          and why the next decade of automation belongs to Artificial Narrow Intelligence.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={onGetStarted}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              borderRadius: "10px",
              background: "#3b82f6",
              color: "#fff",
              fontWeight: 700,
              fontSize: "15px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Deploy Praxis Engine
            <IconArrowRight size={16} />
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate("demo")}
              style={{
                padding: "12px 24px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Open Interactive Sandbox
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Sticky Sidebar TOC + Article Body */}
      <div style={{ display: "flex", gap: "60px", alignItems: "flex-start" }}>
        {/* Sticky Table of Contents Sidebar */}
        <aside
          style={{
            width: "300px",
            position: "sticky",
            top: "90px",
            flexShrink: 0,
            display: "none", // Visible on large screens via inline css media simulation
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            paddingRight: "16px",
          }}
          className="manifesto-toc"
        >
          <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: "16px" }}>
            Table of Contents
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                style={{
                  textAlign: "left",
                  background: activeSection === sec.id ? "rgba(56, 189, 248, 0.12)" : "transparent",
                  border: "none",
                  borderLeft: activeSection === sec.id ? "2px solid #38bdf8" : "2px solid transparent",
                  padding: "8px 12px",
                  borderRadius: "0 6px 6px 0",
                  fontSize: "13px",
                  fontWeight: activeSection === sec.id ? 700 : 500,
                  color: activeSection === sec.id ? "#38bdf8" : "#94a3b8",
                  cursor: "pointer",
                  lineHeight: 1.4,
                  transition: "all 0.15s ease",
                }}
              >
                {sec.title}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: "32px", padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>
              Ready to test deterministic operational workflows?
            </div>
            <button
              onClick={onGetStarted}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Start Free Trial →
            </button>
          </div>
        </aside>

        {/* Article Body */}
        <article
          style={{
            flex: 1,
            maxWidth: "880px",
            fontSize: "17px",
            lineHeight: 1.8,
            color: "#cbd5e1",
          }}
        >
          {/* ========================================================================= */}
          {/* PROLOGUE */}
          {/* ========================================================================= */}
          <section id="prologue" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Prologue: The Crisis of Probabilistic Automation
            </h2>

            <p>
              In the early 2020s, the computing world was swept by the intoxicating premise of Generative Pretrained Transformers.
              For decades, computer systems had been brittle, rigid, and incapable of processing unstructured human nuance.
              Language models obliterated that rigidity in a single stroke. Suddenly, software could summarize complex legal briefs,
              generate fluid human prose, translate across languages, and write syntactically plausible computer code.
            </p>

            <p>
              Yet, as enterprises rushed to deploy these probabilistic engines into physical operations—power grids, high-speed chemical synthesis,
              semiconductor fabrication, clinical emergency wards, and aviation dispatch—a catastrophic structural disconnect emerged.
              Large Language Models do not possess a model of physical truth, nor do they understand state transitions, operational invariants,
              or physical law. They are auto-regressive statistical predictors: given a sequence of tokens, they sample from a conditional probability
              distribution to produce the most mathematically plausible continuation.
            </p>

            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                borderLeft: "4px solid #ef4444",
                borderRadius: "0 12px 12px 0",
                padding: "20px 24px",
                margin: "32px 0",
                fontSize: "16px",
                color: "#fca5a5",
              }}
            >
              <strong>The Fundamental Fallacy of Probabilistic Control:</strong>
              <div style={{ marginTop: "8px", color: "#fecaca", lineHeight: 1.6 }}>
                Prompt engineering is not a safety proof. Instructing an LLM to "always adhere to safety guidelines" or "never violate the operational threshold"
                is a polite linguistic suggestion, not a mathematical guarantee. When a probabilistic agent controls physical actuators, a 99.7% token accuracy rate
                guarantees that 3 out of every 1,000 state transitions will violate operational boundaries, leading inevitably to equipment destruction,
                cascading blackouts, or mortal injury.
              </div>
            </div>

            <p>
              Operational automation cannot survive on statistical plausibility. When a 5-axis CNC spindle exceeds its thermal tolerance by 14 degrees Celsius,
              or an ICU infusion pump encounters an ambiguous titration instruction, the required response is not an articulate, persuasive hallucination.
              The required response is an unambiguous, mathematically proven, deterministically enforced invariant.
            </p>

            <p>
              This is the crisis of modern artificial intelligence. We have built cognitive engines capable of boundless creative extrapolation,
              yet we lack the architectural scaffolding to bind them to physical and operational reality. Praxis was conceived to resolve this crisis:
              to synthesize the inductive brilliance of machine intelligence with the deductive certainty of formal verification.
            </p>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER I */}
          {/* ========================================================================= */}
          <section id="philosophy" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter I: The Praxis Philosophy of Governance
            </h2>

            <p>
              Praxis is founded upon a radical yet classical engineering axiom: <em>Intelligence proposes, but formal automata dispose.</em>
              We do not treat artificial intelligence as an autonomous sovereign entity that executes actions in the wild.
              Rather, we treat AI as an advisory heuristic generator embedded within an impenetrable, mathematically verifiable state governor.
            </p>

            <p>
              The architecture of Praxis rests on three immutable pillars that govern every calculation, recommendation, and operational event:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", margin: "32px 0" }}>
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "24px" }}>
                <h4 style={{ color: "#38bdf8", margin: "0 0 8px", fontSize: "18px" }}>1. Absolute Determinism at the Execution Boundary</h4>
                <p style={{ margin: 0, fontSize: "15px", color: "#94a3b8" }}>
                  Every operational process is modeled as an explicit Deterministic Finite Automaton (DFA). No action can transition the system
                  into an unverified state. If a proposed action cannot be proven to satisfy all invariant predicates, the transition is mathematically rejected
                  before execution signals reach physical actuators or external transactional APIs.
                </p>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "24px" }}>
                <h4 style={{ color: "#818cf8", margin: "0 0 8px", fontSize: "18px" }}>2. Multi-Objective Graph-Theoretic Optimality</h4>
                <p style={{ margin: 0, fontSize: "15px", color: "#94a3b8" }}>
                  Operational decisions are not binary yes/no choices; they are complex trade-offs across financial cost, machine downtime, safety margins,
                  and human operator fatigue. Praxis formulates operational remediation as a multi-criteria shortest path discovery problem over weighted
                  directed multigraphs, identifying Pareto-optimal trajectories using generalized Dijkstra algorithms.
                </p>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "24px" }}>
                <h4 style={{ color: "#34d399", margin: "0 0 8px", fontSize: "18px" }}>3. Immutable Cryptographic Provenance</h4>
                <p style={{ margin: 0, fontSize: "15px", color: "#94a3b8" }}>
                  Every state transition, supervisory sign-off, heuristic evaluation, and threshold override is cryptographically hashed into an immutable
                  SHA-256 Merkle chain. In an autonomous enterprise, accountability must be mathematically provable in a court of law, regulatory hearing,
                  or insurance post-mortem.
                </p>
              </div>
            </div>

            <p>
              By separating the heuristic layer (which identifies possibilities) from the governance layer (which enforces invariants),
              Praxis transforms unpredictable AI from a hazardous liability into a disciplined, governed operational asset.
            </p>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER II */}
          {/* ========================================================================= */}
          <section id="dfa-engine" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter II: Formal Verification & Deterministic Automata
            </h2>

            <p>
              The theoretical foundation of Praxis originates in the rigorous lineage of computer science: the theory of formal languages,
              automata theory, and Dijkstra's constructive approach to software verification.
            </p>

            <p>
              Formally, any operational domain governed by Praxis is represented as a 5-tuple Deterministic Finite Automaton:
            </p>

            <div
              style={{
                background: "#090d16",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "14px",
                padding: "24px",
                margin: "28px 0",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "15px",
                color: "#7dd3fc",
                overflowX: "auto",
              }}
            >
              <div>{"// Mathematical Specification of Praxis Operational Automaton"}</div>
              <div style={{ color: "#f8fafc", fontWeight: 700, margin: "8px 0" }}>
                M = (Q, Σ, δ, q₀, F)
              </div>
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                Where:<br />
                • Q = &#123; q_draft, q_submitted, q_evaluating, q_approved, q_pending_maint, q_executing, q_resolved, q_halted &#125;<br />
                • Σ = Alphabet of permissible operational actions, supervisory signatures, and telemetry triggers<br />
                • δ: Q × Σ → Q is the deterministic transition function satisfying ∀q ∈ Q, ∀σ ∈ Σ: |δ(q, σ)| ≤ 1<br />
                • q₀ = Initial operational state (e.g., q_draft or q_submitted)<br />
                • F ⊆ Q = Set of terminal invariant-satisfying absorbing states (e.g., q_resolved)
              </div>
            </div>

            <p>
              In conventional systems, workflow logic is implemented via ad-hoc procedural conditional branches (`if-else` blocks)
              scattered across thousands of lines of application code. In such systems, edge-case combinations of concurrent requests,
              network retries, and asynchronous race conditions invariably cause the system to enter undefined, hazardous states.
            </p>

            <p>
              In Praxis, transition function $\delta$ is an immutable mathematical mapping. Every state $q \in Q$ possesses an explicit
              invariant predicate $P(q)$. The core theorem enforced at every microsecond of execution is the Invariant Preservation Theorem:
            </p>

            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "20px",
                margin: "24px 0",
                fontStyle: "italic",
                color: "#e2e8f0",
              }}
            >
              &ldquo;For any valid state q_k satisfying invariant P(q_k) = True, and any input symbol &sigma; &isin; &Sigma;,
              the transition to state q_(k+1) = &delta;(q_k, &sigma;) is permitted if and only if P(q_(k+1)) = True
              and the authorization role R(&sigma;) satisfies the privilege boundary T(q_k &rarr; q_(k+1)).
              If P(q_(k+1)) &ne; True, the transition is structurally impossible and fails closed.&rdquo;
            </div>

            <p>
              This architectural guarantee completely eliminates state leakage, deadlocks, and unauthorized escalation.
              Whether an action is initiated by a manual operator, a scheduled background job, or an autonomous ANI agent,
              it must pass through the identical formal verification gate.
            </p>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER III */}
          {/* ========================================================================= */}
          <section id="dijkstra-graph" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter III: Graph Optimization & Pareto Frontiers
            </h2>

            <p>
              Once safety is guaranteed by the DFA state engine, an enterprise faces a secondary, equally vital challenge:
              <em>Which permitted action is the optimal action?</em>
            </p>

            <p>
              In physical operations, remediation options exist along a multidimensional Pareto surface. Consider a critical
              bearing failure on a production bottling line:
            </p>

            <ul style={{ paddingLeft: "24px", margin: "16px 0", lineHeight: 1.8 }}>
              <li><strong>Option A (Immediate Emergency Replacement):</strong> Restores machine integrity in 45 minutes; costs ₹85,000 in expedited parts; disrupts an active ₹500,000 batch.</li>
              <li><strong>Option B (Degraded Mode Operation):</strong> Reduces spindle speed by 40%; avoids batch dumping; permits scheduled repair during night shift; accumulates ₹12,000 in mechanical wear.</li>
              <li><strong>Option C (Load Re-routing):</strong> Diverts downstream capacity to Line 3; incurs 15-minute conveyor reconfiguration downtime; operates within nominal maintenance cost.</li>
            </ul>

            <p>
              Praxis models the space of operational interventions as a weighted directed graph $G = (V, E)$, where vertices $V$ represent
              operational states and edges $E$ represent executable maintenance interventions. The weight $W(e)$ of each edge $e = (u, v) \in E$
              is not a scalar number, but a dynamic vector function:
            </p>

            <div
              style={{
                background: "#090d16",
                border: "1px solid rgba(129, 140, 248, 0.2)",
                borderRadius: "14px",
                padding: "24px",
                margin: "24px 0",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "15px",
                color: "#c7d2fe",
              }}
            >
              W(e) = α · C_financial(e) + β · T_downtime(e) + γ · R_safety(e) + λ · U_fatigue(e)
            </div>

            <p>
              Here, weights $\alpha, \beta, \gamma, \lambda$ reflect the enterprise's real-time objective priorities. During peak production hours,
              downtime weight $\beta$ dynamically increases; during routine cycles, financial cost weight $\alpha$ dominates.
            </p>

            <p>
              Using a modified, constraint-bounded Dijkstra search, Praxis computes the optimal trajectory through the operational state space.
              The algorithm evaluates candidate paths while enforcing hard cutoffs: any path that causes the cumulative risk metric to exceed
              the supervisory threshold R_max is pruned immediately, regardless of its financial economy.
            </p>

            <p>
              The result is a transparent, explainable decision matrix. Instead of opaque "black box" neural recommendations,
              Praxis presents the human supervisor with the exact mathematical trade-off curve, showing how each rupee spent translates
              into preserved machine hours and mitigated risk.
            </p>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER IV */}
          {/* ========================================================================= */}
          <section id="cryptographic-isolation" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter IV: Zero-Leak Multi-Tenancy & Ledgers
            </h2>

            <p>
              In modern enterprise software, multi-tenancy is frequently an afterthought—an application-level `tenant_id` column added to a shared SQL database.
              History has repeatedly proven that software-level filtering bugs, ORM caching vulnerabilities, and misconfigured query joins
              inevitably lead to tenant data leakage.
            </p>

            <p>
              In mission-critical industrial manufacturing and defense logistics, a data leakage event is not merely an embarrassing GDPR violation;
              it is an existential intellectual property breach. Praxis implements a multi-tier cryptographic containment model:
            </p>

            <div style={{ margin: "28px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "20px" }}>
                <h5 style={{ color: "#38bdf8", margin: "0 0 6px", fontSize: "16px" }}>1. Cryptographic Tenant Partitioning</h5>
                <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
                  Every tenant database session is bound to an isolated connection context with mandatory Row-Level Security (RLS) enforced at the PostgreSQL engine kernel level.
                  Even if an attacker gains arbitrary SQL injection within the application layer, the database engine itself rejects any query attempting to cross the cryptographic tenant fence.
                </p>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "20px" }}>
                <h5 style={{ color: "#818cf8", margin: "0 0 6px", fontSize: "16px" }}>2. Merkle Chaining of Operational Decisions</h5>
                <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
                  Every event log entry in Praxis includes the cryptographic hash of the preceding event:
                  H_i = SHA256(H_(i-1) || t_i || actor_i || action_i || payload_i).
                  This guarantees that historical records cannot be rewritten, truncated, or forged retroactively by rogue operators or database administrators.
                </p>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "20px" }}>
                <h5 style={{ color: "#34d399", margin: "0 0 6px", fontSize: "16px" }}>3. Role-Based Mathematical Privilege Separation</h5>
                <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
                  Approval authority is not a static Boolean flag; it is a parameter in the state transition equation. A Maintenance Supervisor cannot sign off on an intervention
                  exceeding ₹10,000, not because the frontend hides the button, but because the backend DFA engine computes |W(e)| &gt; Limit(R) and asserts an invariant fault.
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER V */}
          {/* ========================================================================= */}
          <section id="ani-paradigm" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter V: The ANI Paradigm vs. General Hallucination
            </h2>

            <p>
              The technology industry has spent billions of dollars pursuing Artificial General Intelligence (AGI)—an omniscient synthetic mind
              capable of writing poetry, debating philosophy, composing music, and writing general software.
            </p>

            <p>
              While AGI remains a fascinating philosophical frontier, <em>the physical and industrial world has no use for generalized intelligence.</em>
              A high-speed train control system does not need an AI that writes poetry. An open-heart bypass pump does not need an agent that chats about world politics.
              A petrochemical cracking tower does not need a conversational companion.
            </p>

            <p>
              What critical infrastructure requires is <strong>Artificial Narrow Intelligence (ANI)</strong>:
              an intelligence designed with extreme mathematical focus, strict domain boundaries, and zero extraneous capability.
            </p>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(129, 140, 248, 0.08) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                borderRadius: "16px",
                padding: "28px",
                margin: "32px 0",
              }}
            >
              <h4 style={{ color: "#38bdf8", margin: "0 0 12px", fontSize: "20px" }}>The Four Axioms of the Praxis Decision ANI</h4>
              <ol style={{ paddingLeft: "20px", margin: 0, color: "#cbd5e1", lineHeight: 1.8 }}>
                <li><strong>Strict Domain Restriction:</strong> The Praxis ANI refuses to answer trivia, write arbitrary code, or engage in casual chit-chat. It answers only: "I am a specialized Decision ANI. I can only assist with operational decisions and constraint analysis."</li>
                <li><strong>Invariant-Bounded Reasoning:</strong> The ANI reasons exclusively within the structured context of machine telemetry, operational states, and formal governance constraints.</li>
                <li><strong>Zero Hallucination Tolerance:</strong> The agent does not fabricate solutions. If a state transition lacks historical calibration or invariant compliance, it outputs explicit uncertainty metrics.</li>
                <li><strong>Subservience to Deterministic Verifiers:</strong> The output of the ANI is never executed directly; it is treated as a candidate input to the DFA verification pipeline.</li>
              </ol>
            </div>

            <p>
              By constraining the agent's problem space to decision optimization, we achieve order-of-magnitude gains in speed, reliability,
              and safety. The agent becomes an infallible co-pilot for human operators, illuminating hidden trade-offs without ever overstepping its bounds.
            </p>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER VI - INDUSTRIAL MANUFACTURING */}
          {/* ========================================================================= */}
          <section id="industry-manufacturing" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter VI: Industrial Manufacturing & Industry 4.0
            </h2>

            <p>
              Modern manufacturing plants are marvels of mechanical synchronization. A typical automotive stamping and welding facility
              operates hundreds of robotic arms, CNC machining stations, conveyor systems, and hydraulic presses.
              In this environment, an unplanned line stoppage costs an average of <strong>₹250,000 per minute</strong>.
            </p>

            <p>
              Traditional plant maintenance is caught in a paralyzing dilemma:
            </p>

            <ul style={{ paddingLeft: "24px", margin: "16px 0", lineHeight: 1.8 }}>
              <li><strong>Reactive Maintenance (Run-to-Failure):</strong> Wait until a component shatters, causing catastrophic collateral damage, emergency parts procurement at 400% premiums, and days of idle plant capacity.</li>
              <li><strong>Calendar-Based Preventive Maintenance:</strong> Replace parts every 90 days regardless of condition, discarding millions of rupees worth of functional equipment prematurely and inducing maintenance-related failure modes during disassembly.</li>
            </ul>

            <p>
              Praxis establishes the third, superior paradigm: <strong>Condition-Governed Autonomous Maintenance</strong>.
            </p>

            <p>
              Vibration frequency spectra, motor winding currents, and thermal dissipation metrics are continuously ingested from SCADA sensors.
              Our predictive Random Forest and Gradient Boosted models project the component's Remaining Useful Life (RUL) with high statistical confidence.
              However, the AI does not simply fire an alert into a noisy email inbox.
            </p>

            <p>
              Instead, Praxis instantiates a formal complaint entity within the DFA state machine. The machine immediately computes the optimal maintenance
              window using production scheduling graphs: it identifies an upcoming 30-minute tooling changeover tomorrow at 14:00, allocates the required
              SKF 6208 bearing from inventory, assigns the work order to a certified Level 2 technician, and routes the approval to the Maintenance Supervisor.
            </p>

            <p>
              The intervention is executed before the mechanical failure occurs, with zero unplanned downtime, zero manual paperwork, and 100% auditable traceability.
            </p>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER VII - HEALTHCARE */}
          {/* ========================================================================= */}
          <section id="industry-healthcare" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter VII: Healthcare & Clinical Safety Protocols
            </h2>

            <p>
              Nowhere is the need for formal verification more acute than in clinical medicine. In hospital intensive care units (ICUs) and emergency wards,
              clinicians operate under conditions of extreme sleep deprivation, cognitive overload, and information saturation.
              Medical errors remain the third leading cause of death in modern hospital systems.
            </p>

            <p>
              Consider the administration of high-risk intravenous medications—such as vasopressors, anticoagulants, and insulin.
              A single decimal misplaced during manual dosage titration can trigger fatal cardiac arrhythmias or irreversible neurological damage.
            </p>

            <p>
              Praxis models clinical pharmacotherapy and patient care pathways as formal state charts:
            </p>

            <div
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: "14px",
                padding: "24px",
                margin: "24px 0",
              }}
            >
              <h5 style={{ color: "#34d399", margin: "0 0 10px", fontSize: "17px" }}>The Clinical DFA Safety Guard</h5>
              <div style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.7 }}>
                Before an electronic health record (EHR) or smart infusion pump executes a titration instruction, the Praxis clinical engine verifies:
                <br /><br />
                1. <strong>Physiological Invariant $P_1$:</strong> Is patient mean arterial pressure (MAP) within nominal boundaries?
                <br />
                2. <strong>Pharmacological Invariant $P_2$:</strong> Does the proposed compound exhibit cross-reactivity with active laboratory biomarkers (e.g. serum creatinine &gt; 2.5 mg/dL)?
                <br />
                3. <strong>Authority Invariant $P_3$:</strong> Has the prescription been signed by a board-certified intensivist possessing verified cryptographic credentials?
              </div>
            </div>

            <p>
              If any invariant predicate evaluates to False, the system halts the infusion pump, presents the exact mathematical contradiction to the nursing staff,
              and prevents the adverse drug event before a single droplet enters the patient's bloodstream.
            </p>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER VIII - QUANTITATIVE FINANCE */}
          {/* ========================================================================= */}
          <section id="industry-finance" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter VIII: Quantitative Finance & Risk Defense
            </h2>

            <p>
              Global financial markets are the fastest automated systems on Earth. In high-frequency trading (HFT) and algorithmic market-making,
              trading decisions occur in nanoseconds. Over the past two decades, uncontrolled algorithmic execution has precipitated catastrophic
              market dislocations—from the 2010 Flash Crash to the Knight Capital disaster, where a software deployment glitch destroyed $440 million in 45 minutes.
            </p>

            <p>
              These disasters occur because trading algorithms are optimized exclusively for alpha generation (profit discovery), with risk controls
              implemented as secondary, asynchronous monitoring services that react after toxic orders have already flooded exchange matching engines.
            </p>

            <p>
              Praxis enforces <strong>Deterministic Pre-Trade Invariant Validation</strong>. Every order packet transmitted by algorithmic strategies must traverse
              a hardware-accelerated formal verification gate:
            </p>

            <ul style={{ paddingLeft: "24px", margin: "16px 0", lineHeight: 1.8 }}>
              <li><strong>Net Capital Exposure Constraint:</strong> Total portfolio position value must strictly satisfy &le; MaxApprovedLeverage.</li>
              <li><strong>Liquidity Impact Boundary:</strong> Proposed order volume V_order &le; 0.05 &times; ADV (Average Daily Volume).</li>
              <li><strong>Order Velocity Invariant:</strong> Cancellation-to-fill ratio must remain within regulatory exchange tolerance metrics.</li>
            </ul>

            <p>
              If a malfunctioning reinforcement learning model begins generating runaway feedback orders, the Praxis DFA gate detects the invariant violation
              at the microsecond execution boundary and transitions the trading line to a deterministic `SAFE_HALT` state, insulating the institution from ruin.
            </p>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER IX - AEROSPACE & DEFENSE */}
          {/* ========================================================================= */}
          <section id="industry-aerospace" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter IX: Aerospace, Energy Grids & Defense
            </h2>

            <p>
              In civil aviation, autonomous space exploration, and nationwide electrical grid management, the margin for operational error is exactly zero.
              When an orbital satellite loses attitude control, or a regional 400kV electrical substation encounters a lightning-induced phase imbalance,
              human intervention is frequently too slow to prevent disaster.
            </p>

            <p>
              Autonomous control is mandatory, but autonomous control without formal verification is unacceptable.
              Praxis provides the mathematical bridge that allows autonomous aerospace vehicles and energy grids to execute split-second contingency plans
              with absolute mathematical safety guarantees.
            </p>

            <p>
              In power distribution grids, Praxis models electrical load routing as a dynamic network flow problem with Kirchhoff's voltage and current laws
              acting as hard invariant constraints. When a transmission line trips due to a thermal sag event, the Praxis engine calculates the alternative
              power distribution topology using graph optimization, verifies that no feeder line will exceed 92% of thermal rating, and triggers automated
              switchgear actuation within 80 milliseconds—averting regional blackouts.
            </p>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER X - MATHEMATICAL PROOFS */}
          {/* ========================================================================= */}
          <section id="mathematical-proofs" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter X: Formal Proofs & State Matrices
            </h2>

            <p>
              To substantiate the integrity of Praxis, we present the core formal theorems that govern the engine's execution lifecycle.
            </p>

            <div
              style={{
                background: "#090d16",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "14px",
                padding: "24px",
                margin: "28px 0",
              }}
            >
              <h4 style={{ color: "#38bdf8", margin: "0 0 12px", fontSize: "18px" }}>Theorem 1: Safety & Non-Reachability of Hazard States</h4>
              <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.7, margin: "0 0 16px" }}>
                Let Q_hazard &sub; Q denote the set of unsafe operational states (e.g., states violating machine physical limits or unauthorized fiscal thresholds).
                Let q_0 &isin; Q \ Q_hazard be the initial system state. If every transition &delta;(q, &sigma;) enforces the invariant check
                Assert(P(q&apos;) = True &and; q&apos; &notin; Q_hazard), then for any arbitrary sequence of input actions &sigma;_1, &sigma;_2, &hellip;, &sigma;_n,
                the resulting state q_n &notin; Q_hazard.
              </p>
              <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#a5b4fc" }}>
                <strong>Proof by Induction:</strong><br />
                Base step: By definition, q_0 &notin; Q_hazard.<br />
                Inductive step: Assume q_k &notin; Q_hazard. On input &sigma;_(k+1), the transition function calculates candidate q* = &delta;(q_k, &sigma;_(k+1)).
                If q* &isin; Q_hazard, the guard condition fails, the transition is rejected, and the system either remains at q_k or enters q_halted &notin; Q_hazard.
                Thus q_(k+1) &notin; Q_hazard. By mathematical induction, hazard states are unreachable under all execution traces. &#8718;
              </div>
            </div>

            <div
              style={{
                background: "#090d16",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "14px",
                padding: "24px",
                margin: "28px 0",
              }}
            >
              <h4 style={{ color: "#818cf8", margin: "0 0 12px", fontSize: "18px" }}>Theorem 2: Strict Termination of Dijkstra Graph Optimizations</h4>
              <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.7, margin: "0 0 16px" }}>
                Let G = (V, E) be the operational state transition multigraph. If all edge weight vectors satisfy W(e) &gt; 0
                (i.e., non-negative financial, temporal, and risk costs), then the bounded shortest path discovery algorithm terminates in at most
                O(|E| + |V| log |V|) operations, and is guaranteed to return the global minimum cost trajectory without infinite recursion or cycle trapping.
              </p>
              <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#a5b4fc" }}>
                <strong>Proof Sketch:</strong> Since edge weights are strictly positive (W(e) &gt; 0), no negative weight cycles can exist.
                With a Fibonacci heap priority queue, Dijkstra's invariant guarantees that once a vertex v is extracted from the queue,
                its shortest path distance is finalized. The algorithm is deterministically bounded in time and space complexity. ∎
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER XI - ROADMAP */}
          {/* ========================================================================= */}
          <section id="roadmap-2030" style={{ marginBottom: "80px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Chapter XI: The 2026–2030 Universal Operations Roadmap
            </h2>

            <p>
              The transition from probabilistic experimentation to deterministic operational governance is the defining computing movement of our era.
              Our engineering roadmap charts the expansion of Praxis over the next four years:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", margin: "32px 0" }}>
              <div style={{ borderLeft: "3px solid #38bdf8", paddingLeft: "20px" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc" }}>2026: The Hybrid Governance Substrate (Current)</div>
                <p style={{ margin: "6px 0 0", fontSize: "15px", color: "#94a3b8" }}>
                  Delivery of the core Praxis DFA engine, Dijkstra Pareto trajectory planner, Clerk-integrated multi-tenancy,
                  and specialized Decision ANI agent. Initial production deployments across automotive and precision CNC plants.
                </p>
              </div>

              <div style={{ borderLeft: "3px solid #818cf8", paddingLeft: "20px" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc" }}>2027: Edge-Native Formal Microkernels</div>
                <p style={{ margin: "6px 0 0", fontSize: "15px", color: "#94a3b8" }}>
                  Porting the Praxis DFA validation kernel to zero-dependency Rust and WebAssembly, enabling 500-microsecond verification cycles
                  embedded directly on industrial programmable logic controllers (PLCs) and edge gateways.
                </p>
              </div>

              <div style={{ borderLeft: "3px solid #34d399", paddingLeft: "20px" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc" }}>2028: Multi-Plant Cross-Facility Orchestration</div>
                <p style={{ margin: "6px 0 0", fontSize: "15px", color: "#94a3b8" }}>
                  Autonomous supply chain synchronization. Enabling separate facilities to exchange cryptographically verified operational state proofs
                  to rebalance regional production loads without exposing proprietary manufacturing formulations.
                </p>
              </div>

              <div style={{ borderLeft: "3px solid #c084fc", paddingLeft: "20px" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc" }}>2029–2030: Universal Civil Infrastructure Verification</div>
                <p style={{ margin: "6px 0 0", fontSize: "15px", color: "#94a3b8" }}>
                  Standardization of formal operational automata for smart power grids, air traffic management, municipal water desalination,
                  and autonomous transit networks. Achieving zero-unplanned-failure civil infrastructure worldwide.
                </p>
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "20px",
                padding: "36px",
                textAlign: "center",
                marginTop: "48px",
              }}
            >
              <h3 style={{ fontSize: "26px", fontWeight: 800, color: "#f8fafc", margin: "0 0 12px" }}>
                Build on Proven Foundations
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "16px", maxWidth: "600px", margin: "0 auto 24px" }}>
                Join the vanguard of engineers and operators replacing probabilistic vulnerability with formal certainty.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
                <button
                  onClick={onGetStarted}
                  className="btn-primary"
                  style={{
                    padding: "12px 28px",
                    background: "#3b82f6",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Start 30-Day Free Trial
                </button>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate("business")}
                    style={{
                      padding: "12px 24px",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#cbd5e1",
                      borderRadius: "10px",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Explore Enterprise Tier
                  </button>
                )}
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
