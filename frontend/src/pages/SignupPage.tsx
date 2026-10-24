import { useMemo, useState, type FormEvent } from "react";
import { ApiError, signup, type User } from "../api";
import { IconAlert, IconCheckCircle, IconSpinner } from "../components/Icons";
import { Logo } from "../components/Logo";

interface SignupPageProps {
  onSignup: (user: User, token: string) => void;
  onSignIn: () => void;
}

interface PasswordRule {
  label: string;
  met: boolean;
}

function evaluatePassword(password: string) {
  const rules: PasswordRule[] = [
    { label: "12+ characters", met: password.length >= 12 },
    { label: "Uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "At least one digit (0-9)", met: /[0-9]/.test(password) },
    { label: "Special symbol (!@#$...)", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = rules.filter((r) => r.met).length;

  let strength: "weak" | "medium" | "strong" = "weak";
  if (metCount === 5 && password.length >= 12) {
    strength = "strong";
  } else if (metCount >= 3 && password.length >= 8) {
    strength = "medium";
  }

  const allMet = metCount === rules.length && password.length <= 128;
  return { rules, strength, allMet, metCount };
}

export function SignupPage({ onSignup, onSignIn }: SignupPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role] = useState<"technician">("technician");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { rules, strength, allMet } = useMemo(() => evaluatePassword(password), [password]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setError("Enter a valid email address.");
    }
    if (!allMet) {
      return setError("Please satisfy all password security requirements.");
    }
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      const result = await signup(email.trim(), password, role);
      setSuccess(true);
      setTimeout(() => {
        onSignup(result.user, result.token);
      }, 800);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not create your account. Please try again."
      );
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="login-page animate-fade">
        <div
          className="login-card animate-scale"
          style={{ textAlign: "center", padding: "48px 24px" }}
          role="status"
          aria-live="polite"
        >
          <div style={{ display: "inline-flex", color: "#22c55e", marginBottom: "16px" }}>
            <IconCheckCircle size={48} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
            Account created
          </h2>
          <p className="text-muted" style={{ fontSize: "14px", marginBottom: "20px" }}>
            Account created. Redirecting to dashboard...
          </p>
          <div style={{ display: "inline-flex", color: "var(--brand)" }}>
            <IconSpinner size={24} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page animate-fade">
      <div className="login-card animate-scale">
        <div className="login-logo"><Logo /></div>
        <p className="login-tagline">Create your technician workspace account.</p>
        <form onSubmit={submit} className="login-form">
          {error && (
            <div className="login-error" role="alert">
              <IconAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="operator@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            {/* Password strength meter */}
            <div className="password-meter-container" style={{ marginTop: "6px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <small style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Password strength:
                </small>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "capitalize",
                    color:
                      password.length === 0
                        ? "var(--text-muted)"
                        : strength === "strong"
                        ? "#22c55e"
                        : strength === "medium"
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                >
                  {password.length > 0 ? strength : "None"}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "4px",
                  height: "4px",
                }}
                aria-label={`Password strength: ${password.length > 0 ? strength : "none"}`}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: "2px",
                    background:
                      password.length === 0
                        ? "var(--border-subtle)"
                        : strength === "weak"
                        ? "#ef4444"
                        : strength === "medium"
                        ? "#f59e0b"
                        : "#22c55e",
                    transition: "background 0.2s ease",
                  }}
                />
                <div
                  style={{
                    height: "100%",
                    borderRadius: "2px",
                    background:
                      strength === "medium"
                        ? "#f59e0b"
                        : strength === "strong"
                        ? "#22c55e"
                        : "var(--border-subtle)",
                    transition: "background 0.2s ease",
                  }}
                />
                <div
                  style={{
                    height: "100%",
                    borderRadius: "2px",
                    background: strength === "strong" ? "#22c55e" : "var(--border-subtle)",
                    transition: "background 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Real-time validation feedback checklist */}
            <div
              className="password-checklist"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px 8px",
                marginTop: "8px",
                padding: "8px 10px",
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-sm)",
                fontSize: "11px",
              }}
              aria-label="Password requirements checklist"
            >
              {rules.map((rule) => (
                <div
                  key={rule.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: rule.met ? "#22c55e" : "var(--text-muted)",
                    transition: "color 0.15s ease",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>{rule.met ? "✓" : "○"}</span>
                  <span>{rule.label}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color:
                    confirm && confirm === password ? "#22c55e" : "var(--text-muted)",
                  gridColumn: "1 / -1",
                  transition: "color 0.15s ease",
                }}
              >
                <span style={{ fontWeight: "bold" }}>
                  {confirm && confirm === password ? "✓" : "○"}
                </span>
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !email.trim() || !allMet || password !== confirm}
          >
            {loading ? (
              <>
                <IconSpinner size={16} /> Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="text-muted" style={{ textAlign: "center", marginTop: "18px" }}>
          Already have an account?{" "}
          <button type="button" className="btn-link" onClick={onSignIn}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
