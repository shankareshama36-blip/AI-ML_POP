import { useState } from "react";
import { SignUp } from "@clerk/clerk-react";
import { login, type User } from "../api";
import { IconSpinner } from "../components/Icons";
import { Logo } from "../components/Logo";
import { useToast, formatUserFriendlyError } from "../components/Toast";

interface SignupPageProps {
  onSignup: (user: User, token: string) => void;
  onSignIn: () => void;
  onBack?: () => void;
}

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

export function SignupPage({ onSignup, onSignIn, onBack }: SignupPageProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [demoLoggingIn, setDemoLoggingIn] = useState(false);

  async function handleDemoLogin() {
    setLoading(true);
    setDemoLoggingIn(true);
    try {
      const result = await login("tech@praxis.local", "Tech@12345!", true);
      showToast("Signed in with Live Demo account", "success");
      onSignup(result.user, result.token);
    } catch (err) {
      console.error("Demo signup bypass failed:", err);
      const friendlyMsg = formatUserFriendlyError(err);
      showToast(friendlyMsg, "error");
    } finally {
      setLoading(false);
      setDemoLoggingIn(false);
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
            aria-label="Go back"
          >
            ← Back
          </button>
        )}
        <div className="login-logo"><Logo /></div>
        <p className="login-tagline">Start governing industrial AI with formal verification.</p>

        {/* 1-Click Demo Bypass */}
        <div className="demo-live-banner" style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="demo-live-hero-btn"
            onClick={() => void handleDemoLogin()}
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

        {/* Clerk Sign Up Component */}
        {PUBLISHABLE_KEY ? (
          <div className="clerk-auth-wrapper" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <SignUp
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
              Clerk authentication enabled. Configure <code>VITE_CLERK_PUBLISHABLE_KEY</code> in your environment to load your live Clerk sign-up form.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#38bdf8" }}>
              Click <strong>&quot;Use Demo Account&quot;</strong> above to explore immediately.
            </p>
          </div>
        )}

        <p className="text-muted" style={{ textAlign: "center", marginTop: "18px" }}>
          Already have an account?{" "}
          <button type="button" className="btn-link" onClick={onSignIn}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
