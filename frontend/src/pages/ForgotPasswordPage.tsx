import { useState, type FormEvent } from "react";
import { requestPasswordReset, resetPassword } from "../api";
import { IconAlert, IconCheckCircle, IconSpinner } from "../components/Icons";
import { Logo } from "../components/Logo";
import { formatUserFriendlyError } from "../components/Toast";

interface ForgotPasswordPageProps {
  onSignIn: () => void;
}

export function ForgotPasswordPage({ onSignIn }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  async function requestReset(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message);
      if (result.reset_token) {
        setToken(result.reset_token);
        setManualToken(result.reset_token);
      }
    } catch (caught) {
      setError(`Action failed: ${formatUserFriendlyError(caught)}`);
    } finally {
      setLoading(false);
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const activeToken = token || manualToken.trim();
    if (!activeToken) {
      return setError("A valid reset token is required.");
    }
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }
    if (password.length < 12) {
      return setError("Password must be at least 12 characters.");
    }
    if (!/[A-Z]/.test(password)) {
      return setError("Password must contain at least one uppercase letter (A-Z).");
    }
    if (!/[a-z]/.test(password)) {
      return setError("Password must contain at least one lowercase letter (a-z).");
    }
    if (!/\d/.test(password)) {
      return setError("Password must contain at least one number (0-9).");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return setError("Password must contain at least one special character (!@#$...).");
    }

    setLoading(true);
    try {
      await resetPassword(activeToken, password);
      setResetSuccess(true);
      setMessage("Your password has been successfully reset. You can now sign in.");
    } catch (caught) {
      setError(`Action failed: ${formatUserFriendlyError(caught)}`);
    } finally {
      setLoading(false);
    }
  }

  if (resetSuccess) {
    return (
      <div className="login-page animate-fade">
        <div
          className="login-card animate-scale"
          style={{ textAlign: "center", padding: "40px 24px" }}
          role="status"
          aria-live="polite"
        >
          <div style={{ display: "inline-flex", color: "#22c55e", marginBottom: "16px" }}>
            <IconCheckCircle size={48} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
            Password Reset Complete
          </h2>
          <p className="text-muted" style={{ fontSize: "14px", marginBottom: "24px" }}>
            Your account password has been updated. You can now sign in with your new credentials.
          </p>
          <button
            type="button"
            className="login-btn"
            onClick={onSignIn}
            style={{ width: "100%" }}
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page animate-fade">
      <div className="login-card animate-scale">
        <button
          type="button"
          className="login-back-btn"
          onClick={onSignIn}
          aria-label="Back to sign in"
        >
          ← Back to Sign In
        </button>

        <div className="login-logo">
          <Logo />
        </div>
        <p className="login-tagline">
          {token || manualToken
            ? "Choose a new secure password for your account."
            : "Reset your Praxis account password."}
        </p>

        {error && (
          <div className="login-error" role="alert" style={{ marginBottom: "16px" }}>
            <IconAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            className="login-success"
            role="status"
            style={{
              padding: "10px 14px",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "var(--radius-sm)",
              color: "#22c55e",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {message}
          </div>
        )}

        {!token && !manualToken ? (
          <form onSubmit={requestReset} className="login-form">
            <div className="login-field">
              <label htmlFor="reset-email">Account Email</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="operator@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading || !email.trim()}>
              {loading ? (
                <>
                  <IconSpinner size={16} /> Requesting Reset…
                </>
              ) : (
                "Send Reset Instructions"
              )}
            </button>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <button
                type="button"
                className="btn-link text-muted"
                onClick={() => setManualToken("manual")}
                style={{ fontSize: "12px" }}
              >
                Already have a reset token? Enter it here
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={savePassword} className="login-form">
            {manualToken === "manual" ? (
              <div className="login-field">
                <label htmlFor="manual-token-input">Reset Token</label>
                <input
                  id="manual-token-input"
                  type="text"
                  placeholder="Paste your reset token here"
                  value={token || ""}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            ) : null}

            <div className="login-field">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 12 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                background: "var(--bg-elevated)",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                marginBottom: "8px",
              }}
            >
              Requirements: 12+ chars, uppercase, lowercase, digit, and symbol.
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading || !password || !confirm}
            >
              {loading ? (
                <>
                  <IconSpinner size={16} /> Updating Password…
                </>
              ) : (
                "Set New Password"
              )}
            </button>

            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button
                type="button"
                className="btn-link text-muted"
                onClick={() => {
                  setToken(null);
                  setManualToken("");
                  setMessage(null);
                  setError(null);
                }}
                style={{ fontSize: "12px" }}
              >
                Request a different token
              </button>
            </div>
          </form>
        )}

        <p className="text-muted" style={{ textAlign: "center", marginTop: "18px" }}>
          Remember your password?{" "}
          <button type="button" className="btn-link" onClick={onSignIn}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
