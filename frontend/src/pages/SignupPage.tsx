import { useEffect } from "react";
import { SignUp, useAuth } from "@clerk/clerk-react";
import { pingHealth, type User } from "../api";
import { Logo } from "../components/Logo";

interface SignupPageProps {
  onSignup?: (user: User, token?: string) => void;
  onSignIn?: () => void;
  onBack?: () => void;
}

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_Y3Jpc3AtdHJvbGwtNDc5Ni5jbGVyay5hY2NvdW50cy5kZXYk";

const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
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

export function SignupPage({ onBack, onSignup }: SignupPageProps) {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    void pingHealth();
    if (isSignedIn && onSignup) {
      onSignup({} as User, "");
    }
  }, [isSignedIn, onSignup]);

  if (isSignedIn) {
    return (
      <div className="login-page animate-fade" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#94a3b8" }}>Redirecting to dashboard…</p>
      </div>
    );
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
        <p className="login-tagline">Start governing decisions with formal verification.</p>

        {PUBLISHABLE_KEY ? (
          <div className="clerk-auth-wrapper" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <SignUp
              routing="hash"
              signInUrl="#/login"
              fallbackRedirectUrl="/"
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
              Clerk authentication is loading. Please verify your internet connection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
