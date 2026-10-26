import { useState, useEffect, type FormEvent } from "react";
import {
  getThresholds,
  updateThresholds,
  toggleAutoApprove,
  getWorkspace,
  rotateInviteCode,
  type User,
  type WorkspaceMember,
  ApiError,
} from "../api";
import {
  IconSettings,
  IconShield,
  IconCheck,
  IconAlert,
  IconSpinner,
  IconCopy,
  IconRefresh,
  IconLogout,
} from "../components/Icons";
import { Logo } from "../components/Logo";
import { useToast } from "../components/Toast";

interface SettingsPageProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export function SettingsPage({ user, onBack, onLogout }: SettingsPageProps) {
  const { showToast } = useToast();
  const isAuthorized = user.role === "plant_manager" || user.role === "business_owner" || Boolean(user.is_admin);

  const [tier1Max, setTier1Max] = useState<number>(10000);
  const [tier2Max, setTier2Max] = useState<number>(50000);
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [togglingAutoApprove, setTogglingAutoApprove] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [rotating, setRotating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState<string>(user.company_name || "Company Workspace");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      try {
        const [thresholdData, workspaceData] = await Promise.all([
          getThresholds().catch(() => ({ tier1_max: 10000, tier2_max: 50000, auto_approve_enabled: false })),
          getWorkspace().catch(() => null),
        ]);

        if (!isMounted) return;

        if (thresholdData) {
          setTier1Max(thresholdData.tier1_max);
          setTier2Max(thresholdData.tier2_max);
          setAutoApprove(Boolean(thresholdData.auto_approve_enabled));
        }

        if (workspaceData) {
          setCompanyName(workspaceData.company_name);
          setInviteCode(workspaceData.invite_code);
          setMembers(workspaceData.members || []);
        }
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof ApiError ? err.message : "Failed to load workspace settings";
        setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [isAuthorized]);

  async function handleSaveThresholds(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (tier1Max <= 0 || tier2Max <= 0) {
      setError("Threshold amounts must be greater than zero.");
      return;
    }

    if (tier2Max <= tier1Max) {
      setError("Tier 2 threshold must be strictly greater than Tier 1 threshold.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateThresholds(tier1Max, tier2Max);
      setTier1Max(updated.tier1_max);
      setTier2Max(updated.tier2_max);
      showToast(
        `Thresholds updated: Tier 1: ₹${updated.tier1_max.toLocaleString()} | Tier 2: ₹${updated.tier2_max.toLocaleString()}`,
        "success"
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update thresholds";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAutoApprove(newVal: boolean) {
    setTogglingAutoApprove(true);
    try {
      const res = await toggleAutoApprove(newVal);
      setAutoApprove(Boolean(res.auto_approve_enabled));
      showToast(
        newVal
          ? "Autonomous AI mode enabled. Requests within Tier 1 limit will auto-approve."
          : "Autonomous AI mode disabled. Standard supervisor approval chain active.",
        "success"
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to toggle autonomous AI mode";
      showToast(msg, "error");
    } finally {
      setTogglingAutoApprove(false);
    }
  }

  async function handleRotateInvite() {
    if (!window.confirm("Are you sure you want to rotate the invite code? The old code will immediately stop working.")) {
      return;
    }
    setRotating(true);
    try {
      const updated = await rotateInviteCode();
      setInviteCode(updated.invite_code);
      showToast("A new secure invite code has been generated.", "info");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to rotate invite code";
      showToast(msg, "error");
    } finally {
      setRotating(false);
    }
  }

  function handleCopyInvite() {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    showToast("Invite code copied to clipboard.", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isAuthorized) {
    return (
      <div className="login-page animate-fade">
        <div className="login-card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ color: "#ef4444", marginBottom: "16px", display: "inline-flex" }}>
            <IconAlert size={48} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
            Access Restricted
          </h2>
          <p className="text-muted" style={{ fontSize: "14px", marginBottom: "24px" }}>
            Only workspace Administrators or Plant Managers have permission to configure approval thresholds and manage team members.
          </p>
          <button type="button" className="btn-primary" onClick={onBack}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page animate-fade" style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* App Navigation Bar */}
      <header className="app-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button type="button" className="btn-ghost" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            ← Back to App
          </button>
          <div style={{ height: "20px", width: "1px", background: "var(--border-subtle)" }} />
          <Logo />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="role-badge" style={{ textTransform: "capitalize" }}>
            {user.role.replace(/_/g, " ")} {user.is_admin ? "• Admin" : ""}
          </span>
          <div className="user-avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
            {user.email.slice(0, 1).toUpperCase()}
          </div>
          <button type="button" className="logout-btn" onClick={onLogout} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <IconLogout size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="page-main" style={{ maxWidth: "1000px" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--brand)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            <IconSettings size={14} /> Workspace Administration
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px 0" }}>
            Settings & Governance
          </h1>
          <p className="text-muted" style={{ margin: 0, fontSize: "14px" }}>
            Configure multi-tier approval limits, view registered colleagues, and manage company credentials for <strong style={{ color: "var(--text-primary)" }}>{companyName}</strong>.
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert" style={{ marginBottom: "24px" }}>
            <IconAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <IconSpinner size={32} />
            <p className="text-muted" style={{ marginTop: "12px" }}>Loading workspace governance data…</p>
          </div>
        ) : (
          <div className="settings-grid">
            {/* Left Column: Approval Thresholds Configuration */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--brand-soft)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconShield size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    Multi-Tier Approval Thresholds
                  </h2>
                  <small className="text-muted">Cost ceilings determine automated routing to supervisors.</small>
                </div>
              </div>

              <div style={{ background: "var(--bg-elevated)", padding: "14px 16px", borderRadius: "var(--radius-md)", fontSize: "13px", lineHeight: "1.6", marginBottom: "20px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ marginBottom: "6px" }}>
                  <strong>Tier 1 Limit:</strong> Costs below this amount are approved solely by the <em>Maintenance Supervisor</em>.
                </div>
                <div style={{ marginBottom: "6px" }}>
                  <strong>Tier 2 Limit:</strong> Costs between Tier 1 and Tier 2 additionally require <em>Production Supervisor</em> sign-off.
                </div>
                <div>
                  <strong>Tier 3 (High Capital):</strong> Costs exceeding Tier 2 require full <em>Plant Manager</em> authorization.
                </div>
              </div>

              {/* Autonomous AI Decision Mode Card */}
              <div
                style={{
                  background: autoApprove ? "rgba(37, 99, 235, 0.08)" : "var(--bg-elevated)",
                  border: `1px solid ${autoApprove ? "var(--brand)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                      Enable Autonomous AI Decisions
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "10px",
                        background: autoApprove ? "#22c55e" : "var(--border-subtle)",
                        color: autoApprove ? "#fff" : "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      {autoApprove ? "Active" : "Off"}
                    </span>
                  </div>
                  <p className="text-muted" style={{ margin: 0, fontSize: "12px", lineHeight: "1.5" }}>
                    When enabled, complaints evaluated within the Tier 1 safety limit auto-approve instantly, bypassing manual supervisor chains.
                  </p>
                </div>
                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "48px",
                    height: "26px",
                    flexShrink: 0,
                    cursor: togglingAutoApprove ? "wait" : "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    disabled={togglingAutoApprove}
                    onChange={(e) => void handleToggleAutoApprove(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                    aria-label="Enable Autonomous AI Decisions"
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: autoApprove ? "var(--brand, #2563eb)" : "var(--border-default, #cbd5e1)",
                      transition: "0.2s ease",
                      borderRadius: "26px",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        height: "20px",
                        width: "20px",
                        left: autoApprove ? "25px" : "3px",
                        bottom: "3px",
                        backgroundColor: "#ffffff",
                        transition: "0.2s ease",
                        borderRadius: "50%",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                      }}
                    />
                  </span>
                </label>
              </div>

              <form onSubmit={handleSaveThresholds}>
                <div className="form-field" style={{ marginBottom: "18px" }}>
                  <label htmlFor="tier1_max" className="form-label" style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>
                    Tier 1 Maximum (₹)
                  </label>
                  <input
                    id="tier1_max"
                    type="number"
                    min="1"
                    step="500"
                    className="form-input"
                    value={tier1Max}
                    onChange={(e) => setTier1Max(Number(e.target.value))}
                    disabled={saving}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
                  />
                  <small className="text-muted" style={{ display: "block", marginTop: "4px" }}>
                    Default: ₹10,000 (Maintenance Supervisor approval limit)
                  </small>
                </div>

                <div className="form-field" style={{ marginBottom: "24px" }}>
                  <label htmlFor="tier2_max" className="form-label" style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>
                    Tier 2 Maximum (₹)
                  </label>
                  <input
                    id="tier2_max"
                    type="number"
                    min={tier1Max + 1}
                    step="1000"
                    className="form-input"
                    value={tier2Max}
                    onChange={(e) => setTier2Max(Number(e.target.value))}
                    disabled={saving}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
                  />
                  <small className="text-muted" style={{ display: "block", marginTop: "4px" }}>
                    Default: ₹50,000 (Production Supervisor approval ceiling)
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || tier2Max <= tier1Max}
                  style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "12px" }}
                >
                  {saving ? (
                    <>
                      <IconSpinner size={16} /> Saving Thresholds…
                    </>
                  ) : (
                    <>
                      <IconCheck size={16} /> Save Threshold Configuration
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Invite Code & Team Members */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Workspace Invite Code Card */}
              <div className="card" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
                  Workspace Invite Code
                </h3>
                <p className="text-muted" style={{ fontSize: "13px", margin: "0 0 14px 0" }}>
                  Share this code with team members so they can join <strong style={{ color: "var(--text-primary)" }}>{companyName}</strong>.
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <code style={{ flex: 1, padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--brand)" }}>
                    {inviteCode || "No invite code"}
                  </code>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleCopyInvite}
                    title="Copy Invite Code"
                    style={{ padding: "8px 12px" }}
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleRotateInvite}
                    disabled={rotating}
                    title="Rotate Invite Code"
                    style={{ padding: "8px 12px" }}
                  >
                    {rotating ? <IconSpinner size={16} /> : <IconRefresh size={16} />}
                  </button>
                </div>
                <small className="text-muted" style={{ fontSize: "11px" }}>
                  Rotating invalidates the old code immediately. Existing members remain active.
                </small>
              </div>

              {/* Registered Team Members Card */}
              <div className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    Team Members ({members.length})
                  </h3>
                </div>

                {members.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: "13px", margin: 0 }}>
                    No other members registered in this workspace yet.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto" }}>
                    {members.map((member) => (
                      <div
                        key={member.email}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-md)",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-subtle)",
                          fontSize: "13px",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {member.email}
                          </div>
                          <small className="text-muted" style={{ textTransform: "capitalize" }}>
                            {member.role.replace(/_/g, " ")}
                          </small>
                        </div>
                        {member.is_admin && (
                          <span className="role-badge" style={{ fontSize: "10px", padding: "2px 6px", background: "var(--brand-soft)", color: "var(--brand)" }}>
                            Admin
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
