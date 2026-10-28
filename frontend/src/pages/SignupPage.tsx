import { useState, useEffect } from "react";
import { SignUp } from "@clerk/clerk-react";
import { type User, type UserRole } from "../api";
import { Logo } from "../components/Logo";

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

export function SignupPage({ onBack }: SignupPageProps) {
  const [role, setRole] = useState<UserRole>(() => {
    try {
      return (localStorage.getItem("praxis-signup-role") as UserRole) || "explorer";
    } catch {
      return "explorer";
    }
  });
  const [inviteCode, setInviteCode] = useState<string>(() => {
    try {
      return localStorage.getItem("praxis-signup-invite") || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("praxis-signup-role", role);
      if (inviteCode.trim()) {
        localStorage.setItem("praxis-signup-invite", inviteCode.trim());
      } else {
        localStorage.removeItem("praxis-signup-invite");
      }
    } catch {
      // ignore storage errors
    }
  }, [role, inviteCode]);

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
        <p className="login-tagline">Start governing decisions with formal verification.</p>

        {/* Customizable Role & Optional Invite Code Selector */}
        <div
          style={{
            marginBottom: "16px",
            padding: "14px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
          }}
        >
          <div className="login-field" style={{ marginBottom: "10px" }}>
            <label
              htmlFor="signup-role-select"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "6px",
                color: "var(--text-primary)",
              }}
            >
              Choose Your Workspace Mode / Role
            </label>
            <select
              id="signup-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
            >
              <option value="explorer">🧭 Explorer — Customizable AI Decision Playground</option>
              <option value="technician">🔧 Technician — Report Machine Issues</option>
              <option value="maintenance_supervisor">🛡️ Maintenance Supervisor — Tier 1 Approver</option>
              <option value="production_supervisor">📈 Production Supervisor — Tier 2 Approver</option>
              <option value="plant_manager">🏭 Plant Manager — Executive Approver &amp; Settings</option>
            </select>
          </div>

          <div className="login-field" style={{ marginBottom: 0 }}>
            <label
              htmlFor="signup-invite-input"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "6px",
                color: "var(--text-secondary)",
              }}
            >
              Team Invite Code (Optional)
            </label>
            <input
              id="signup-invite-input"
              type="text"
              placeholder="Leave blank for your own personal/company workspace"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
            />
          </div>
        </div>

        {/* Clerk Sign Up Component (includes Clerk's own Sign In link in footer) */}
        {PUBLISHABLE_KEY ? (
          <div className="clerk-auth-wrapper" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <SignUp
              routing="hash"
              signInUrl="#/login"
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
              Configure <code>VITE_CLERK_PUBLISHABLE_KEY</code> in your environment to load Clerk sign-up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
