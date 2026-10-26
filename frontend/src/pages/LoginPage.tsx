import { useState, useEffect, type FormEvent } from "react";
import { login, pingHealth, type User } from "../api";
import { IconSpinner } from "../components/Icons";
import { Logo } from "../components/Logo";
import { useToast, formatUserFriendlyError } from "../components/Toast";
import { SocialLoginButtons } from "../components/SocialLoginButtons";

interface LoginPageProps {
  onLogin: (user: User, token: string, persist?: boolean) => void;
  onBack?: () => void;
  onSignup: () => void;
  onForgotPassword?: () => void;
}

const DEMO_ACCOUNTS = [
  { role: "Technician", email: "tech@praxis.local", password: "Tech@12345!" },
  { role: "Maintenance Supervisor", email: "maint@praxis.local", password: "Maint@12345!" },
  { role: "Production Supervisor", email: "prod@praxis.local", password: "Prod@12345!" },
  { role: "Plant Manager", email: "plant@praxis.local", password: "Plant@12345!" },
];

export function LoginPage({ onLogin, onBack, onSignup, onForgotPassword }: LoginPageProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  useEffect(() => {
    // Ping backend when login page opens to warm up Render instance
    void pingHealth();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setIsWakingUp(false);
    const wakeTimer = setTimeout(() => setIsWakingUp(true), 3500);

    try {
      const result = await login(email.trim(), password);
      showToast(`Welcome back, ${result.user.email}!`, "success");
      onLogin(result.user, result.token, remember);
    } catch (err) {
      console.error("Login failed:", err);
      const friendlyMsg = formatUserFriendlyError(err);
      showToast(friendlyMsg, "error");
    } finally {
      clearTimeout(wakeTimer);
      setIsWakingUp(false);
      setLoading(false);
    }
  }

  async function handleDemoLogin(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setIsWakingUp(false);
    const wakeTimer = setTimeout(() => setIsWakingUp(true), 3500);

    try {
      const result = await login(demoEmail, demoPass, true);
      showToast(`Signed in as ${result.user.role.replace(/_/g, " ")}`, "success");
      onLogin(result.user, result.token, true);
    } catch (err) {
      console.error("Demo login failed:", err);
      const friendlyMsg = formatUserFriendlyError(err);
      showToast(friendlyMsg, "error");
    } finally {
      clearTimeout(wakeTimer);
      setIsWakingUp(false);
      setLoading(false);
    }
  }

  const [demoLoggingIn, setDemoLoggingIn] = useState(false);

  async function handleQuickDemo() {
    setDemoLoggingIn(true);
    try {
      await handleDemoLogin("tech@praxis.local", "Tech@12345");
    } finally {
      setDemoLoggingIn(false);
    }
  }

  return (
    <div className="login-page animate-fade">
      <div className="login-card animate-scale">
        {onBack && (
          <button
            type="button"
            className="login-back-btn"
            onClick={onBack}
            aria-label="Go back to landing page"
          >
            ← Back
          </button>
        )}
        <div className="login-logo"><Logo /></div>
        <p className="login-tagline">AI can act. Praxis decides.</p>

        <SocialLoginButtons
          onSuccess={(user, token) => onLogin(user, token, remember)}
          disabled={loading}
        />

        {/* 1-Click Live Demo Login */}
        <div className="demo-live-banner">
          <button
            type="button"
            className="demo-live-hero-btn"
            onClick={() => void handleQuickDemo()}
            disabled={loading}
            aria-label="Try the live demo free with pre-seeded demo account"
          >
            {demoLoggingIn ? (
              <>
                <IconSpinner size={18} /> Entering Live Demo…
              </>
            ) : (
              "🚀 Try the Live Demo (Free)"
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="login-options">
            <label className="form-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            {onForgotPassword && (
              <button
                type="button"
                className="btn-link"
                onClick={onForgotPassword}
              >
                Forgot password?
              </button>
            )}
          </div>
          <button
            type="submit"
            className="login-btn"
            disabled={loading || !email.trim() || !password}
          >
            {loading ? (
              <>
                <IconSpinner size={16} /> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
          {isWakingUp && loading && (
            <p
              style={{
                fontSize: "0.82rem",
                color: "#64748b",
                textAlign: "center",
                marginTop: "10px",
                lineHeight: "1.35",
              }}
            >
              Connecting to backend… Free-tier instance is waking up (may take 20–45s).
            </p>
          )}
        </form>

        <div className="login-demo-toggle" style={{ marginTop: "16px", textAlign: "center" }}>
          <button
            type="button"
            className="btn-link"
            onClick={() => setShowDemo(!showDemo)}
            aria-expanded={showDemo}
            aria-controls="demo-accounts-panel"
            style={{ fontSize: "13px" }}
          >
            {showDemo ? "Hide demo accounts ▲" : "Show demo accounts ▼"}
          </button>
        </div>

        {showDemo && (
          <div
            id="demo-accounts-panel"
            className="login-demo animate-slide-up"
            role="region"
            aria-label="Demo accounts panel"
            style={{ marginTop: "12px", paddingTop: "12px" }}
          >
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}
            >
              Click any account to sign in
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className="demo-row"
                  onClick={() => void handleDemoLogin(acc.email, acc.password)}
                  disabled={loading}
                  aria-label={`Sign in as the demo ${acc.role}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1.3fr 1fr",
                    alignItems: "center",
                    gap: "6px",
                    width: "100%",
                    textAlign: "left",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                  }}
                >
                  <span className="role">{acc.role}</span>
                  <code>{acc.email}</code>
                  <code style={{ color: "var(--text-muted)" }}>{acc.password}</code>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-muted" style={{ textAlign: "center", marginTop: "18px" }}>
          New to Praxis?{" "}
          <button type="button" className="btn-link" onClick={onSignup}>
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
