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

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDemoRoles, setShowDemoRoles] = useState(false);
  const [demoLoggingIn, setDemoLoggingIn] = useState<string | null>(null);

  useEffect(() => {
    void pingHealth();
  }, []);

  async function handleDemoLogin(demoEmail: string, demoPass: string, roleLabel: string) {
    setLoading(true);
    setDemoLoggingIn(demoEmail);

    try {
      const result = await login(demoEmail, demoPass, true);
      showToast(`Signed in as ${roleLabel}`, "success");
      onLogin(result.user, result.token, true);
    } catch (err) {
      console.error("Demo login failed:", err);
      const friendlyMsg = formatUserFriendlyError(err);
      showToast(friendlyMsg, "error");
    } finally {
      setLoading(false);
      setDemoLoggingIn(null);
    }
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

        {/* Single Use Demo Account Button (expands role selector so each role logs in separately) */}
        <div className="demo-live-banner" style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="demo-live-hero-btn"
            onClick={() => setShowDemoRoles((prev) => !prev)}
            disabled={loading}
            aria-expanded={showDemoRoles}
            aria-label="Use Demo Account"
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
                <IconSpinner size={18} /> Signing in to Demo…
              </>
            ) : (
              <>🚀 Use Demo Account {showDemoRoles ? "▲" : "▼"}</>
            )}
          </button>

          {showDemoRoles && (
            <div
              className="animate-slide-up"
              style={{
                marginTop: "10px",
                padding: "12px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)",
                }}
              >
                Choose a Demo Role (Separate accounts for submit &amp; multi-tier approval):
              </div>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => void handleDemoLogin(acc.email, acc.password, acc.role)}
                  disabled={loading}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "9px 12px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    cursor: loading ? "wait" : "pointer",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  <span>{acc.role}</span>
                  <code style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
                    {demoLoggingIn === acc.email ? "Signing in…" : acc.email}
                  </code>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clerk Sign In Component (includes Clerk's own Sign Up link in footer) */}
        {PUBLISHABLE_KEY ? (
          <div className="clerk-auth-wrapper" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <SignIn
              routing="hash"
              signUpUrl="#/signup"
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
            <p style={{ fontSize: "0.88rem", color: "#94a3b8", marginBottom: 0 }}>
              Click <strong>&quot;Use Demo Account&quot;</strong> above to explore the full dashboard instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
