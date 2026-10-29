import { useState } from "react";
import { type PublicView } from "../components/LandingLayout";
import {
  IconArrowRight,
  IconCheckCircle,
  IconShield,
  IconClock,
  IconZap,
  IconSparkles,
  IconLock,
} from "../components/Icons";

interface IndividualPageProps {
  onNavigate?: (view: PublicView) => void;
  onGetStarted: () => void;
}

export function IndividualPage({ onNavigate, onGetStarted }: IndividualPageProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const monthlyPrice = 499;
  const annualPrice = 399; // ₹399/mo billed annually
  const activePrice = billingCycle === "monthly" ? monthlyPrice : annualPrice;

  const features = [
    {
      title: "Personal DFA Verification Engine",
      desc: "Model personal workflows, project constraints, and operational transitions with mathematical determinism. Zero hallucination.",
      icon: <IconShield size={20} color="#3b82f6" />,
    },
    {
      title: "Immutable Local Audit Ledger",
      desc: "Every recommendation, decision gate, and constraint check is cryptographically hashed and logged to your private workspace.",
      icon: <IconLock size={20} color="#10b981" />,
    },
    {
      title: "Praxis Specialized ANI Agent",
      desc: "Query your state constraints and decision pathways with an AI strictly bounded to decision intelligence and operational safety.",
      icon: <IconSparkles size={20} color="#8b5cf6" />,
    },
    {
      title: "Continuous Invariant Monitoring",
      desc: "Detect rule violations and deadlocks before they manifest. Automated mathematical safety guarantees for solo builders.",
      icon: <IconZap size={20} color="#f59e0b" />,
    },
    {
      title: "Export & Compliance Reports",
      desc: "One-click export of state machine trajectories, decision rationales, and audit histories in JSON, CSV, and PDF.",
      icon: <IconCheckCircle size={20} color="#06b6d4" />,
    },
    {
      title: "Cross-Device Session Continuity",
      desc: "Seamless synchronization across desktop, tablet, and mobile with state preserved across browser reloads.",
      icon: <IconClock size={20} color="#ec4899" />,
    },
  ];

  const faqs = [
    {
      q: "What is included in the 30-day free trial?",
      a: "Full, unrestricted access to the complete Individual tier. You can create state models, run unlimited ANI constraint evaluations, and maintain an immutable decision log. No credit card is required to start.",
    },
    {
      q: "How does the Individual plan differ from the Business tier?",
      a: "The Individual plan is tailored for single operators, researchers, engineers, and founders who need formal verification for their own workflows. Business tier adds multi-tenant role hierarchies, multi-tier approval workflows, and SCADA/ERP integrations.",
    },
    {
      q: "What happens after the 30 days conclude?",
      a: "You can continue with our simple subscription at ₹499/month (or ₹399/month billed annually). If you choose not to subscribe, your data remains accessible in read-only export mode forever.",
    },
    {
      q: "Why use Formal Verification instead of general ChatGPT/Claude?",
      a: "LLMs predict the most plausible next token; they have no concept of physical boundaries or state invariants. Praxis couples AI with a Deterministic Finite Automaton (DFA) that mathematically guarantees no invalid operational state is ever executed.",
    },
  ];

  return (
    <div className="individual-page animate-fade" style={{ maxWidth: "1140px", margin: "0 auto", padding: "40px 20px 80px" }}>
      {/* Top Pill */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 16px",
            borderRadius: "999px",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            color: "#60a5fa",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
          B2C Individual License • 30-Day Free Trial
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 54px)",
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#f8fafc",
            maxWidth: "840px",
            margin: "0 auto 20px",
          }}
        >
          Start governing decisions with{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            formal verification.
          </span>
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#94a3b8",
            maxWidth: "680px",
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Designed for technical founders, independent engineers, and autonomous operators.
          Replace probabilistic guesswork with deterministic state guarantees and an immutable decision ledger.
        </p>

        {/* Primary CTA + Manifesto link */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", alignItems: "center" }}>
          <button
            onClick={onGetStarted}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 32px",
              fontSize: "16px",
              fontWeight: 700,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)",
              transition: "all 0.2s ease",
            }}
          >
            Start 30-Day Free Trial
            <IconArrowRight size={18} />
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate("now")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 24px",
                fontSize: "15px",
                fontWeight: 600,
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.04)",
                color: "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Read our Manifesto →
            </button>
          )}
        </div>

        <div style={{ marginTop: "14px", fontSize: "13px", color: "#64748b" }}>
          No credit card required • Instant setup in 60 seconds • Cancel anytime
        </div>
      </div>

      {/* Pricing Showcase Card */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "24px",
          padding: "48px 36px",
          marginBottom: "64px",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "32px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "520px" }}>
            <div style={{ display: "inline-block", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, marginBottom: "16px" }}>
              FIRST 30 DAYS 100% FREE
            </div>
            <h2 style={{ fontSize: "30px", fontWeight: 800, color: "#f8fafc", margin: "0 0 12px" }}>
              Individual Pro
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "16px", lineHeight: 1.6, margin: "0 0 24px" }}>
              Everything a solo operator needs to mathematically verify decisions, eliminate costly edge-case errors, and generate auditable operational proofs.
            </p>

            {/* Billing Toggle */}
            <div style={{ display: "inline-flex", background: "rgba(15, 23, 42, 0.8)", padding: "4px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <button
                onClick={() => setBillingCycle("monthly")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: billingCycle === "monthly" ? "#3b82f6" : "transparent",
                  color: billingCycle === "monthly" ? "#fff" : "#94a3b8",
                  transition: "all 0.15s ease",
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: billingCycle === "annual" ? "#3b82f6" : "transparent",
                  color: billingCycle === "annual" ? "#fff" : "#94a3b8",
                  transition: "all 0.15s ease",
                }}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          {/* Pricing figures */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "20px",
              padding: "32px",
              minWidth: "280px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "14px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              After 30-Day Free Trial
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px", marginBottom: "8px" }}>
              <span style={{ fontSize: "48px", fontWeight: 900, color: "#f8fafc" }}>₹{activePrice}</span>
              <span style={{ color: "#64748b", fontSize: "16px" }}>/month</span>
            </div>
            <div style={{ fontSize: "12px", color: "#10b981", fontWeight: 600, marginBottom: "24px" }}>
              {billingCycle === "annual" ? "Billed annually (₹4,788/yr)" : "Billed monthly, cancel anytime"}
            </div>

            <button
              onClick={onGetStarted}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "12px 20px",
                fontSize: "15px",
                fontWeight: 700,
                borderRadius: "10px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                marginBottom: "12px",
              }}
            >
              Start Free Trial Now
            </button>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              Instant activation via Clerk authentication
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ marginBottom: "64px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h3 style={{ fontSize: "28px", fontWeight: 800, color: "#f8fafc", margin: "0 0 10px" }}>
            Why Autonomous Operators Choose Praxis
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "15px", maxWidth: "600px", margin: "0 auto" }}>
            The power of aerospace-grade formal methods condensed into a clean, intuitive personal cockpit.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {features.map((feat, i) => (
            <div
              key={i}
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "24px",
                transition: "border-color 0.2s ease, transform 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                {feat.icon}
              </div>
              <h4 style={{ fontSize: "17px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>
                {feat.title}
              </h4>
              <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div style={{ maxWidth: "800px", margin: "0 auto 64px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h3 style={{ fontSize: "26px", fontWeight: 800, color: "#f8fafc", margin: "0 0 8px" }}>
            Frequently Asked Questions
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            Have questions about the individual license or the trial? We have answers.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(15, 23, 42, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "20px 24px",
              }}
            >
              <h5 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: "0 0 10px" }}>
                {faq.q}
              </h5>
              <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div
        style={{
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "20px",
          padding: "48px 24px",
        }}
      >
        <h3 style={{ fontSize: "28px", fontWeight: 800, color: "#f8fafc", margin: "0 0 12px" }}>
          Ready to eliminate decision error?
        </h3>
        <p style={{ color: "#94a3b8", fontSize: "16px", maxWidth: "560px", margin: "0 auto 28px" }}>
          Join thousands of forward-thinking operators using deterministic state logic to govern high-stakes choices.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <button
            onClick={onGetStarted}
            className="btn-primary"
            style={{
              padding: "14px 32px",
              fontSize: "15px",
              fontWeight: 700,
              borderRadius: "12px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Create Individual Account
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate("demo")}
              style={{
                padding: "14px 24px",
                fontSize: "15px",
                fontWeight: 600,
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#e2e8f0",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                cursor: "pointer",
              }}
            >
              Explore Free Sandbox →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
