import { useState, useEffect } from "react";
import { SignIn } from "@clerk/clerk-react";
import { login, pingHealth, type User } from "../api";
import { IconSpinner } from "../components/Icons";
import { Logo } from "../components/Logo";
import { useToast, formatUserFriendlyError } from "../components/Toast";

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

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_Y3Jpc3AtdHJvbGwtNDc5Ni5jbGVyay5hY2NvdW50cy5kZXYk";

const clerkAppearance = {
  variables: {
    colorPrimary: "#2563eb",
    colorBackground: "#0f172a",
    colorText: "#f8fafc",
    colorTextSecondary: "#94a3b8",
    colorInputBackground: "#1e293b",
    colorInputText: "#f8fafc",
    borderRadius: "0.5rem",
  },
  elements: {
    card: {
      background: "#0f172a",
      border: "1px solid #334155",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    },
    headerTitle: {
      color: "#f8fafc",
    },
    headerSubtitle: {
      color: "#94a3b8",
    },
    socialButtonsBlockButton: {
      border: "1px solid #334155",
      background: "#1e293b",
      color: "#f8fafc",
      "&:hover": {
        background: "#334155",
      },
    },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      "&:hover": {
        background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
      },
    },
    footerActionLink: {
      color: "#60a5fa",
    },
  },
};

export function LoginPage({ onLogin, onBack, onSignup }: LoginPageProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [demoLoggingIn, setDemoLoggingIn] = useState(false);

  useEffect(() => {
    void pingHealth();
  }, []);

  async function handleDemoLogin(demoEmail: string, demoPass: string) {
    setLoading(true);
    setDemoLoggingIn(true);

    try {
      const result = await login(demoEmail, demoPass, true);
      showToast(`Signed in as ${result.user.role.replace(/_/g, " ")}`, "success");
      onLogin(result.user, result.token, true);
    } catch (err) {
      console.error("Demo login failed:", err);
      const friendlyMsg = formatUserFriendlyError(err);
      showToast(friendlyMsg, "error");
    } finally {
      setLoading(false);
      setDemoLoggingIn(false);
    }
  }

  async function handleQuickDemo() {
    await handleDemoLogin("tech@praxis.local", "Tech@12345!");
  }

  return (
    <div className="login-page animate-fade">
      <div className="login-card animate-scale" style={{ maxWidth: "480px" }}>
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

        {/* 1-Click Demo Account Bypass */}
        <div className="demo-live-banner" style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="demo-live-hero-btn"
            onClick={() => void handleQuickDemo()}
            disabled={loading}
            aria-label="Use Demo Account for testing"
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "0.95rem",
              fontWeight: 600,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
            }}
          >
            {demoLoggingIn ? (
              <>
                <IconSpinner size={18} /> Entering Demo Mode…
              </>
            ) : (
              "🚀 Use Demo Account (Bypass Clerk)"
            )}
          </button>
        </div>

        {/* Clerk Sign In Component */}
        {PUBLISHABLE_KEY ? (
          <div className="clerk-auth-wrapper" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <SignIn
              routing="hash"
              appearance={clerkAppearance}
            />
          </div>
        ) : (
          <div
            style={{
              padding: "16px",
              background: "rgba(30, 41, 59, 0.7)",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              textAlign: "center",
              margin: "12px 0",
            }}
          >
            <p style={{ fontSize: "0.88rem", color: "#94a3b8", marginBottom: "12px" }}>
              Clerk authentication enabled. Configure <code>VITE_CLERK_PUBLISHABLE_KEY</code> in your environment to load your live Clerk login.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#38bdf8" }}>
              Click <strong>&quot;Use Demo Account&quot;</strong> above to explore the full dashboard instantly.
            </p>
          </div>
        )}

        {/* Demo Roles Toggle */}
        <div className="login-demo-toggle" style={{ marginTop: "16px", textAlign: "center" }}>
          <button
            type="button"
            className="btn-link"
            onClick={() => setShowDemo(!showDemo)}
            aria-expanded={showDemo}
            aria-controls="demo-accounts-panel"
            style={{ fontSize: "13px" }}
          >
            {showDemo ? "Hide demo accounts ▲" : "Select specific demo role ▼"}
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
              Click any demo account to test
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className="demo-row"
                  onClick={() => void handleDemoLogin(acc.email, acc.password)}
                  disabled={loading}
                  aria-label={`Sign in as ${acc.role}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1.3fr",
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
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-muted" style={{ textAlign: "center", marginTop: "18px" }}>
          Don&apos;t have an account?{" "}
          <button type="button" className="btn-link" onClick={onSignup}>
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
