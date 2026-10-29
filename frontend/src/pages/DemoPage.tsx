import { useState, useRef, useEffect, type FormEvent } from "react";
import { login, demoChatWithExplorer, type User, type ChatMessageInput } from "../api";
import { type PublicView } from "../components/LandingLayout";
import { useToast, formatUserFriendlyError } from "../components/Toast";
import {
  IconArrowRight,
  IconCheckCircle,
  IconSend,
  IconSparkles,
  IconSpinner,
  IconZap,
} from "../components/Icons";
import { UpgradeSidePopup } from "../components/UpgradeSidePopup";

interface DemoPageProps {
  onDemoLogin: (user: User, token?: string) => void;
  onNavigate?: (view: PublicView) => void;
}

const DEMO_ROLES = [
  {
    role: "technician",
    label: "Technician",
    email: "tech@praxis.local",
    pass: "Tech@12345!",
    badge: "Tier 0 — Floor Submitter",
    color: "#3b82f6",
    description: "Submit machine telemetry, flag degraded bearings, and trigger real-time DFA validation.",
    icon: "🔧",
    capabilities: ["Submit fault complaints", "Inspect machine telemetry", "View initial DFA validation trace"],
  },
  {
    role: "maintenance_supervisor",
    label: "Maintenance Supervisor",
    email: "maint@praxis.local",
    pass: "Maint@12345!",
    badge: "Tier 1 Approver (< ₹10,000)",
    color: "#10b981",
    description: "Run ML predictive evaluations, review downtime estimates, and authorize first-line actions.",
    icon: "🛡️",
    capabilities: ["Evaluate AI recommendations", "Approve interventions < ₹10k", "Escalate high-cost failures"],
  },
  {
    role: "production_supervisor",
    label: "Production Supervisor",
    email: "prod@praxis.local",
    pass: "Prod@12345!",
    badge: "Tier 2 Approver (< ₹50,000)",
    color: "#f59e0b",
    description: "Balance preventive maintenance downtime against scheduled factory batch commitments.",
    icon: "📈",
    capabilities: ["Multi-line throughput trade-offs", "Approve interventions < ₹50k", "Audit schedule impact"],
  },
  {
    role: "plant_manager",
    label: "Plant Manager",
    email: "plant@praxis.local",
    pass: "Plant@12345!",
    badge: "Executive Accountability",
    color: "#8b5cf6",
    description: "Executive safety and financial sign-off, threshold configuration, and audit log inspection.",
    icon: "🏭",
    capabilities: ["Final sign-off on > ₹50k repairs", "Configure approval thresholds", "Full compliance audit trail"],
  },
];

const DEMO_PROMPTS = [
  "Evaluate bearing vibration spike on CNC-07",
  "How does DFA prevent illegal operational states?",
  "Compare emergency repair vs degraded operation",
  "Explain multi-objective Pareto trade-offs",
];

export function DemoPage({ onDemoLogin, onNavigate }: DemoPageProps) {
  const { showToast } = useToast();
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);

  // 10-Credit Demo System
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem("praxis-demo-credits");
    return saved !== null && !Number.isNaN(Number(saved)) ? Number(saved) : 10;
  });
  const [showUpgradePopup, setShowUpgradePopup] = useState<boolean>(false);

  // AI Demo Chat State
  const [messages, setMessages] = useState<ChatMessageInput[]>([
    {
      role: "assistant",
      content:
        "Hello! I am Praxis, a specialized ANI Decision Agent. In this sandbox demo, you have 10 free trial credits to test operational constraint evaluations, Pareto trade-offs, and DFA invariant proofs. Ask an operational decision problem below!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSendMessage(textToSend?: string) {
    const content = (textToSend ?? input).trim();
    if (!content || isSending) return;

    // Check credits
    if (credits <= 0) {
      setShowUpgradePopup(true);
      showToast("You have used all 10 free demo messages. Please upgrade to continue.", "error");
      return;
    }

    // Deduct credit
    const nextCredits = Math.max(0, credits - 1);
    setCredits(nextCredits);
    localStorage.setItem("praxis-demo-credits", String(nextCredits));

    const userMsg: ChatMessageInput = { role: "user", content };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setIsSending(true);

    try {
      const res = await demoChatWithExplorer(newHistory, "Praxis Sandbox Operational Context");
      setMessages([...newHistory, { role: "assistant", content: res.reply }]);

      if (nextCredits === 0) {
        setTimeout(() => {
          setShowUpgradePopup(true);
        }, 1200);
      }
    } catch (err: unknown) {
      console.error("Demo chat error:", err);
      const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (
        errMsg.includes("connect eperm") ||
        errMsg.includes("backend connection error") ||
        errMsg.includes("failed to fetch") ||
        errMsg.includes("networkerror") ||
        errMsg.includes("503") ||
        errMsg.includes("502") ||
        errMsg.includes("504") ||
        errMsg.includes("timed out") ||
        errMsg.includes("cold start")
      ) {
        showToast("Backend is sleeping. Please wait 30 seconds and try again.", "error");
      } else {
        showToast(formatUserFriendlyError(err), "error");
      }
    } finally {
      setIsSending(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    void handleSendMessage();
  }

  async function handleRoleClick(email: string, pass: string, roleName: string) {
    if (loggingInRole) return;
    setLoggingInRole(email);

    try {
      const res = await login(email, pass, true);
      showToast(`Logged in as ${roleName}. Welcome to the Sandbox!`, "success");
      onDemoLogin(res.user, res.token);
    } catch (err: unknown) {
      console.error("Demo login error:", err);
      const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (
        errMsg.includes("connect eperm") ||
        errMsg.includes("backend connection error") ||
        errMsg.includes("failed to fetch") ||
        errMsg.includes("networkerror") ||
        errMsg.includes("503") ||
        errMsg.includes("502") ||
        errMsg.includes("504") ||
        errMsg.includes("timed out") ||
        errMsg.includes("cold start")
      ) {
        showToast("Backend is sleeping. Please wait 30 seconds and try again.", "error");
      } else {
        showToast(formatUserFriendlyError(err), "error");
      }
    } finally {
      setLoggingInRole(null);
    }
  }

  return (
    <div className="demo-page animate-fade" style={{ maxWidth: "1140px", margin: "0 auto", padding: "40px 20px 80px" }}>
      {/* Upgrade Side Drawer Modal */}
      <UpgradeSidePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        onNavigate={onNavigate}
        onSignUp={() => onNavigate?.("signup")}
        onPricing={() => onNavigate?.("pricing")}
      />

      {/* Header Banner */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 14px",
            borderRadius: "999px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#34d399",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          Interactive Production Sandbox
        </div>
        <h1 style={{ fontSize: "clamp(30px, 4.5vw, 42px)", fontWeight: 800, margin: "0 0 12px", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Experience Multi-Tier Governance in Real Time
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "680px", margin: "0 auto 20px", lineHeight: "1.6" }}>
          Test the Praxis Decision ANI directly below with <strong>10 free demo credits</strong>, or launch into any of the 4 pre-configured factory roles with 1-click.
        </p>
        <button
          type="button"
          className="btn-link"
          onClick={() => onNavigate?.("now")}
          style={{ fontSize: "14px", color: "#60a5fa", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          Want to understand the mathematics behind the engine? Read our Manifesto →
        </button>
      </div>

      {/* Interactive 10-Credit AI Demo Chat Box */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.35)",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "56px",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header bar of Chat Box with Credit Meter */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSparkles size={20} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>
                Praxis Specialized Decision ANI
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                Live public demo • Bounded to operational constraint analysis
              </div>
            </div>
          </div>

          {/* Credits Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "999px",
                background: credits > 3 ? "rgba(16, 185, 129, 0.12)" : credits > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.15)",
                border: `1px solid ${credits > 3 ? "rgba(16, 185, 129, 0.3)" : credits > 0 ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                color: credits > 3 ? "#34d399" : credits > 0 ? "#fbbf24" : "#f87171",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              <IconZap size={14} color={credits > 3 ? "#34d399" : credits > 0 ? "#fbbf24" : "#f87171"} />
              Demo Credits: {credits} / 10
            </div>

            {credits === 0 && (
              <button
                type="button"
                onClick={() => setShowUpgradePopup(true)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  background: "#3b82f6",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Upgrade →
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div
          style={{
            maxHeight: "360px",
            minHeight: "180px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            paddingRight: "8px",
            marginBottom: "20px",
          }}
        >
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "14px 18px",
                    borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isUser ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "rgba(15, 23, 42, 0.8)",
                    border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                    color: isUser ? "#fff" : "#e2e8f0",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {!isUser && (
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#60a5fa", marginBottom: "4px", textTransform: "uppercase" }}>
                      Praxis ANI
                    </div>
                  )}
                  {m.content}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "12px 18px",
                  borderRadius: "16px 16px 16px 4px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#94a3b8",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IconSpinner size={16} /> Evaluating constraints & Pareto states…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          <span style={{ fontSize: "12px", color: "#64748b", alignSelf: "center", marginRight: "4px" }}>
            Try:
          </span>
          {DEMO_PROMPTS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              disabled={isSending || credits <= 0}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: credits > 0 ? "#cbd5e1" : "#64748b",
                fontSize: "12px",
                cursor: credits > 0 ? "pointer" : "not-allowed",
                transition: "all 0.15s ease",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              credits > 0
                ? "Ask Praxis Decision ANI about operational constraints, DFA rules, or failure trade-offs…"
                : "0 credits remaining. Upgrade or sign up to continue."
            }
            disabled={isSending || credits <= 0}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#f8fafc",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending || credits <= 0}
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              background: credits > 0 ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "rgba(255, 255, 255, 0.08)",
              color: credits > 0 ? "#fff" : "#64748b",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              cursor: credits > 0 && input.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isSending ? <IconSpinner size={16} /> : <IconSend size={16} />}
            Send
          </button>
        </form>
      </div>

      {/* Section Divider */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
          Or Launch Full Factory Roles (1-Click Sandbox Bypass)
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
          Inspect the complete plant floor dashboard from each operator&apos;s permission tier:
        </p>
      </div>

      {/* 4 1-Click Role Login Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          marginBottom: "60px",
        }}
      >
        {DEMO_ROLES.map((r) => {
          const isLoading = loggingInRole === r.email;
          return (
            <div
              key={r.email}
              className="demo-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "14px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                transition: "transform 0.2s ease, border-color 0.2s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span style={{ fontSize: "30px" }}>{r.icon}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: `color-mix(in srgb, ${r.color} 15%, transparent)`,
                      color: r.color,
                      border: `1px solid color-mix(in srgb, ${r.color} 30%, transparent)`,
                    }}
                  >
                    {r.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: "19px", fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>
                  {r.label}
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 16px" }}>
                  {r.description}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", fontSize: "13px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {r.capabilities.map((c) => (
                    <li key={c} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <IconCheckCircle size={14} style={{ color: r.color }} /> {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleRoleClick(r.email, r.pass, r.label)}
                  disabled={Boolean(loggingInRole)}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "12px",
                    fontWeight: 600,
                    fontSize: "14px",
                    background: isLoading
                      ? "var(--bg-elevated)"
                      : `linear-gradient(135deg, ${r.color} 0%, color-mix(in srgb, ${r.color} 75%, black) 100%)`,
                    border: "none",
                  }}
                >
                  {isLoading ? (
                    <>
                      <IconSpinner size={16} /> Signing in…
                    </>
                  ) : (
                    <>
                      Launch as {r.label} <IconArrowRight size={15} />
                    </>
                  )}
                </button>
                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  <code style={{ fontSize: "11px", color: "var(--text-muted)" }}>{r.email}</code>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* How Sandbox Workflow Works */}
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          padding: "32px",
        }}
      >
        <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px", color: "var(--text-primary)" }}>
          How to Test the Approval Chain in the Sandbox:
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginTop: "20px" }}>
          <div style={{ padding: "16px", background: "var(--bg-surface)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#3b82f6" }}>Step 1: Submit</span>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "8px 0 0" }}>
              Sign in as <strong>Technician</strong> and submit a high-severity fault on machine <code>CNC-07</code>.
            </p>
          </div>
          <div style={{ padding: "16px", background: "var(--bg-surface)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>Step 2: Tier 1 Evaluate</span>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "8px 0 0" }}>
              Switch to <strong>Maintenance Supervisor</strong>, run the AI evaluation, and sign off Tier 1.
            </p>
          </div>
          <div style={{ padding: "16px", background: "var(--bg-surface)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b" }}>Step 3: Tier 2 Balance</span>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "8px 0 0" }}>
              Switch to <strong>Production Supervisor</strong> to verify line capacity before advancing.
            </p>
          </div>
          <div style={{ padding: "16px", background: "var(--bg-surface)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#8b5cf6" }}>Step 4: Plant Lead</span>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "8px 0 0" }}>
              Log in as <strong>Plant Manager</strong> for final fiscal sign-off and threshold policy inspection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
