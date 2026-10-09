import { useState, type FormEvent } from "react";
import { login, type User } from "../api";
import { IconAlert, IconSpinner } from "../components/Icons";

interface LoginPageProps {
  onLogin: (user: User) => void;
  onBack?: () => void;
}

const DEMO_USERS = [
  { username: "tech-1", pass: "tech123", role: "technician", label: "Technician" },
  { username: "maint-sup", pass: "maint123", role: "maintenance_supervisor", label: "Maint Sup" },
  { username: "prod-sup", pass: "prod123", role: "production_supervisor", label: "Prod Sup" },
  { username: "plant-mgr", pass: "plant123", role: "plant_manager", label: "Plant Mgr" },
];

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError(null);

    try {
      const user = await login(username.trim(), password);
      onLogin(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("401")) {
        setError("Invalid credentials. Please verify your username and password.");
      } else {
        setError("Login failed: " + msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSelectDemoUser(u: { username: string; pass: string }) {
    setUsername(u.username);
    setPassword(u.pass);
    setError(null);
  }

  return (
    <div className="login-page animate-fade">
      <div className="login-card animate-scale">
        {onBack && (
          <button
            type="button"
            className="login-back-btn"
            onClick={onBack}
            aria-label="Back to intro"
          >
            ← Back
          </button>
        )}

        <div className="login-logo">
          AM<span>&</span>POP
        </div>
        <p className="login-tagline">AI can act. AM&amp;POP decides.</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <IconAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="e.g. tech-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !username.trim() || !password}
          >
            {loading ? (
              <>
                <IconSpinner size={16} /> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="login-demo">
          <h4>Quick Login</h4>
          <div>
            {DEMO_USERS.map((u) => (
              <div
                key={u.username}
                className="demo-row"
                onClick={() => handleSelectDemoUser(u)}
                title={`Click to fill credentials for ${u.label}`}
              >
                <span>{u.username}</span>
                <span>{u.pass}</span>
                <span className="role">{u.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
