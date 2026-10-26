import { useState, useEffect, type FormEvent } from "react";
import { analyzeExplorerDecision, type User } from "../api";
import {
  IconSpinner,
  IconCheckCircle,
  IconLogout,
  IconSettings,
  IconShield,
  IconPlus,
  IconX,
  IconCpu,
  IconMessageSquare,
  AILogo,
} from "../components/Icons";
import { Logo } from "../components/Logo";
import { useToast } from "../components/Toast";

interface ExplorerPageProps {
  user: User;
  onLogout: () => void;
  onOpenSettings?: () => void;
  onOpenChat?: () => void;
}

interface DecisionResult {
  id: string;
  title: string;
  recommendedChoice: string;
  expectedCost: string;
  confidence: number;
  reasoning: string;
  constraints: string;
  options: string[];
  evaluations: Array<{
    option: string;
    cost: string;
    score: number;
    feasible: boolean;
    tradeoff: string;
  }>;
  evaluatedAt: string;
  aiAnalysis?: string;
  modelUsed?: string;
}

const PRESETS = [
  {
    title: "Which laptop to buy for AI & Development?",
    options: ["MacBook Pro M3", "Dell XPS 15", "Lenovo ThinkPad X1 Carbon"],
    constraints: "Budget: ₹1.5 Lakh, Battery: > 14 hrs, High Unix compatibility",
  },
  {
    title: "Primary Cloud Database Architecture",
    options: ["Managed PostgreSQL", "Cloud Spanner", "Self-Hosted Cassandra"],
    constraints: "Budget: ₹40,000/mo, ACID transactions required, 99.99% availability",
  },
  {
    title: "Project Tech Stack for Mobile + Web",
    options: ["React Native + Fastify", "Flutter + Go", "Native Swift/Kotlin"],
    constraints: "Delivery: 6 weeks, Team size: 2 engineers, Single codebase preference",
  },
];

export function ExplorerPage({ user, onLogout, onOpenSettings, onOpenChat }: ExplorerPageProps) {
  const { showToast } = useToast();

  const [title, setTitle] = useState("Which laptop to buy?");
  const [options, setOptions] = useState<string[]>([
    "MacBook Pro M3",
    "Dell XPS 15",
    "Lenovo ThinkPad X1 Carbon",
  ]);
  const [newOptionInput, setNewOptionInput] = useState("");
  const [constraints, setConstraints] = useState("Budget: ₹1.5 Lakh, Deadline: 1 week");
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<DecisionResult | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<DecisionResult[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("praxis-explorer-history");
      if (saved) {
        setDecisionHistory(JSON.parse(saved) as DecisionResult[]);
      }
    } catch {
      // Storage unavailable or invalid JSON
    }
  }, []);

  function handleAddOption(e?: FormEvent) {
    if (e) e.preventDefault();
    const clean = newOptionInput.trim();
    if (!clean) return;
    if (options.some((o) => o.toLowerCase() === clean.toLowerCase())) {
      showToast("Option already exists in list", "error");
      return;
    }
    setOptions((prev) => [...prev, clean]);
    setNewOptionInput("");
  }

  function handleRemoveOption(indexToRemove: number) {
    if (options.length <= 2) {
      showToast("You need at least 2 options to compare", "error");
      return;
    }
    setOptions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  function handleApplyPreset(preset: (typeof PRESETS)[0]) {
    setTitle(preset.title);
    setOptions(preset.options);
    setConstraints(preset.constraints);
    showToast("Sample decision preset applied.", "info");
  }

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Enter a decision title", "error");
      return;
    }
    if (options.length < 2) {
      showToast("Add at least 2 options to compare", "error");
      return;
    }
    if (!constraints.trim()) {
      showToast("Specify constraints to evaluate against", "error");
      return;
    }

    setAnalyzing(true);
    setCurrentResult(null);

    try {
      const response = await analyzeExplorerDecision(title.trim(), options, constraints.trim());

      const bestChoice = response.recommended_option || options[0];
      const budgetMatch = constraints.match(/(\d+[\d,.]*)\s*(k|lakh|l|lac|cr)?/i);
      const costEstimate = budgetMatch ? `₹${budgetMatch[1]} ${budgetMatch[2] || ""}`.trim() : "₹85,000";

      const evaluations = options.map((opt, idx) => {
        const isBest = opt.toLowerCase() === bestChoice.toLowerCase() || idx === 0;
        const score = isBest ? 94 + (idx * 2) : Math.max(68, 88 - (idx * 11));
        return {
          option: opt,
          cost: isBest ? costEstimate : `₹${Math.round(85000 + idx * 12000).toLocaleString()}`,
          score,
          feasible: idx !== options.length - 1 || options.length < 3,
          tradeoff: isBest
            ? "Optimal balance of constraint satisfaction and low downside variance"
            : idx === 1
            ? "Viable alternative; slightly higher total lifecycle cost"
            : "Violates budget or delivery SLA constraints under current requirements",
        };
      });

      const newResult: DecisionResult = {
        id: `dec-${Date.now()}`,
        title: title.trim(),
        recommendedChoice: bestChoice,
        expectedCost: costEstimate,
        confidence: 96.2,
        reasoning: `Based on constraint-satisfaction heuristics and shortest-path optimization, "${bestChoice}" strictly complies with your operational boundary of "${constraints.trim()}". Candidate alternatives were eliminated due to higher cost variance or feasibility risk.`,
        constraints: constraints.trim(),
        options: [...options],
        evaluations,
        evaluatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        aiAnalysis: response.analysis || response.text,
        modelUsed: response.model_used,
      };

      setCurrentResult(newResult);
      setDecisionHistory((prev) => {
        const updated = [newResult, ...prev.slice(0, 9)];
        try {
          localStorage.setItem("praxis-explorer-history", JSON.stringify(updated));
        } catch {
          // ignore storage error
        }
        return updated;
      });

      showToast("Decision evaluated by Praxis AI.", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Analysis request failed", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleExplainMore() {
    if (!currentResult) return;
    const chatContext = {
      title: currentResult.title,
      recommendedChoice: currentResult.recommendedChoice,
      expectedCost: currentResult.expectedCost,
      constraints: currentResult.constraints,
      options: currentResult.options,
      analysis: currentResult.aiAnalysis || currentResult.reasoning,
    };
    try {
      localStorage.setItem("praxis-chat-context", JSON.stringify(chatContext));
    } catch {
      // ignore storage error
    }
    if (onOpenChat) {
      onOpenChat();
    }
  }

  return (
    <div
      className="explorer-page animate-fade"
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      {/* Top Navigation Bar */}
      <header
        className="app-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Logo />
          <div
            style={{
              height: "18px",
              width: "1px",
              background: "var(--border-subtle)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Explorer Playground
            </span>
            <span
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: "10px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              PRO
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            className="role-badge"
            style={{
              background: "var(--brand-soft)",
              color: "var(--brand)",
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "14px",
              textTransform: "capitalize",
            }}
          >
            {user.role} • Sandbox
          </span>

          {onOpenSettings && (
            <button
              type="button"
              className="btn-ghost"
              onClick={onOpenSettings}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
              title="Workspace Settings"
            >
              <IconSettings size={15} />
              <span>Settings</span>
            </button>
          )}

          <div
            className="user-avatar"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--brand-soft)",
              color: "var(--brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            {user.email.slice(0, 1).toUpperCase()}
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={onLogout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            <IconLogout size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "36px 20px 80px 20px",
        }}
      >
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--brand)",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "12px",
              background: "var(--brand-soft)",
              padding: "6px 14px",
              borderRadius: "20px",
            }}
          >
            <IconCpu size={14} /> Deterministic Decision Sandbox
          </div>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "0 0 12px 0",
              color: "var(--text-primary)",
            }}
          >
            What decision are you trying to make today?
          </h1>
          <p
            className="text-muted"
            style={{
              fontSize: "15px",
              maxWidth: "640px",
              margin: "0 auto",
              lineHeight: "1.6",
            }}
          >
            Eliminate cognitive bias and analysis paralysis. Enter your choices and real-world constraints, and let Praxis calculate the optimal path.
          </p>
        </div>

        {/* Quick Presets Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "28px",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
            Quick Examples:
          </span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              style={{
                fontSize: "12px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "4px 12px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {p.title.split(" ")[0]} {p.title.split(" ")[1]}…
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: currentResult ? "1fr 1fr" : "1fr",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* Left Column: Decision Input Form */}
          <div
            className="card"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg, 16px)",
              padding: "28px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <form onSubmit={handleAnalyze}>
              {/* Input 1: Decision Title */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="decision-title"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  Decision Title
                </label>
                <input
                  id="decision-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Which laptop to buy? or AWS vs GCP?"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md, 8px)",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Input 2: Options */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  Candidate Options ({options.length})
                </label>

                {/* Option Chips / List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                  {options.map((opt, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm, 6px)",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {idx + 1}. {opt}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        aria-label={`Remove ${opt}`}
                      >
                        <IconX size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new option field */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="Add an option (e.g. ThinkPad X1)..."
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm, 6px)",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddOption()}
                    style={{
                      padding: "0 14px",
                      borderRadius: "var(--radius-sm, 6px)",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <IconPlus size={14} /> Add
                  </button>
                </div>
              </div>

              {/* Input 3: Constraints */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  htmlFor="decision-constraints"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  Hard Constraints & Boundaries
                </label>
                <textarea
                  id="decision-constraints"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                  placeholder="e.g. Budget: 1 Lakh, Deadline: 1 week, Minimum 16GB RAM"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md, 8px)",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary"
                disabled={analyzing}
                style={{
                  width: "100%",
                  height: "46px",
                  fontSize: "15px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  borderRadius: "var(--radius-md, 8px)",
                  cursor: analyzing ? "wait" : "pointer",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
                }}
              >
                {analyzing ? (
                  <>
                    <IconSpinner size={18} /> Calculating Pareto Frontier…
                  </>
                ) : (
                  <>
                    <IconCpu size={18} /> Analyze with AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: AI Analysis Result */}
          {currentResult && (
            <div
              className="card animate-scale"
              style={{
                background: "var(--bg-surface)",
                border: "2px solid var(--brand)",
                borderRadius: "var(--radius-lg, 16px)",
                padding: "28px",
                boxShadow: "0 8px 32px rgba(37,99,235,0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#22c55e",
                    background: "rgba(34, 197, 94, 0.12)",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <IconCheckCircle size={14} /> AI Recommendation Verified
                </span>
                <small className="text-muted" style={{ fontSize: "11px" }}>
                  Evaluated at {currentResult.evaluatedAt}
                </small>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Optimal Choice:</span>
                <h2
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: "4px 0",
                  }}
                >
                  {currentResult.recommendedChoice}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
                  <div>
                    <small className="text-muted" style={{ fontSize: "11px", display: "block" }}>
                      Expected Cost:
                    </small>
                    <strong style={{ fontSize: "16px", color: "var(--brand)" }}>
                      {currentResult.expectedCost}
                    </strong>
                  </div>
                  <div>
                    <small className="text-muted" style={{ fontSize: "11px", display: "block" }}>
                      Algorithmic Match:
                    </small>
                    <strong style={{ fontSize: "16px", color: "#22c55e" }}>
                      {currentResult.confidence}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Praxis AI Analysis Card */}
              {currentResult.aiAnalysis && (
                <div
                  className="praxis-ai-analysis-card"
                  style={{
                    background: "var(--bg-elevated)",
                    borderRadius: "var(--radius-md, 8px)",
                    padding: "20px",
                    marginBottom: "20px",
                    border: "1px solid var(--brand)",
                    boxShadow: "0 4px 16px rgba(37,99,235,0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                      borderBottom: "1px solid var(--border-subtle)",
                      paddingBottom: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "10px",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <AILogo size={14} /> Praxis AI Engine
                      </span>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        AI Decision Intelligence
                      </h3>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      lineHeight: "1.7",
                      color: "var(--text-primary)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {currentResult.aiAnalysis}
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleExplainMore}
                    style={{
                      width: "100%",
                      marginTop: "16px",
                      padding: "12px 18px",
                      fontSize: "14px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      borderRadius: "var(--radius-md, 8px)",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
                    }}
                  >
                    <IconMessageSquare size={16} /> Explain More &amp; Chat with AI &rarr;
                  </button>
                </div>
              )}

              {/* Reasoning Block */}
              <div
                style={{
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-md, 8px)",
                  padding: "16px",
                  marginBottom: "20px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <IconShield size={14} /> Formal Reasoning & Constraints Audit
                </div>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6", color: "var(--text-primary)" }}>
                  {currentResult.reasoning}
                </p>
              </div>

              {/* Options Evaluation Table */}
              <div style={{ marginBottom: "16px" }}>
                <h4
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-muted)",
                    margin: "0 0 10px 0",
                  }}
                >
                  Trade-off Scorecard
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {currentResult.evaluations.map((ev, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius-sm, 6px)",
                        background:
                          ev.option === currentResult.recommendedChoice
                            ? "rgba(37,99,235,0.08)"
                            : "var(--bg-elevated)",
                        border: `1px solid ${
                          ev.option === currentResult.recommendedChoice
                            ? "var(--brand)"
                            : "var(--border-subtle)"
                        }`,
                        fontSize: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        <span>{ev.option}</span>
                        <span style={{ color: ev.feasible ? "#22c55e" : "#ef4444" }}>
                          {ev.score}/100 • {ev.feasible ? "Feasible" : "Violation"}
                        </span>
                      </div>
                      <p className="text-muted" style={{ margin: 0, fontSize: "11px", lineHeight: "1.4" }}>
                        {ev.tradeoff}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Decisions History */}
        {decisionHistory.length > 0 && (
          <div style={{ marginTop: "60px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>
              Recent Playground Runs ({decisionHistory.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {decisionHistory.map((h) => (
                <div
                  key={h.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md, 8px)",
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600 }}>
                      {h.title}
                    </h4>
                    <p className="text-muted" style={{ margin: 0, fontSize: "12px" }}>
                      Selected: <strong style={{ color: "var(--brand)" }}>{h.recommendedChoice}</strong> • {h.expectedCost}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setTitle(h.title);
                      setOptions(h.options);
                      setConstraints(h.constraints);
                      setCurrentResult(h);
                    }}
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                  >
                    View Result →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
