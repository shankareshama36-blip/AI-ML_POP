import { useState, type FormEvent } from "react";
import { login, type User } from "../api";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const DEMO_USERS = [
  { username: "tech-1", pass: "tech123", role: "technician", label: "Technician" },
  { username: "maint-sup", pass: "maint123", role: "maintenance_supervisor", label: "Maintenance Supervisor" },
  { username: "prod-sup", pass: "prod123", role: "production_supervisor", label: "Production Supervisor" },
  { username: "plant-mgr", pass: "plant123", role: "plant_manager", label: "Plant Manager" },
];

export function LoginPage({ onLogin }: LoginPageProps) {
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
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <h1>AM&amp;POP</h1>
          <p className="tagline">AI can act. AM&amp;POP decides.</p>
          <span className="login-subtitle">Sign in to your operational portal</span>
        </header>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-box">{error}</div>}

          <label>
            Username
            <input
              type="text"
              autoComplete="username"
              placeholder="e.g. tech-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </label>

          <button type="submit" disabled={loading || !username.trim() || !password}>
            {loading ? (
              <>
                <span className="spinner" /> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="demo-credentials-section">
          <h3>Demo Credentials</h3>
          <p className="demo-hint">Click any user to auto-populate credentials:</p>
          <div className="demo-users-grid">
            {DEMO_USERS.map((u) => (
              <button
                key={u.username}
                type="button"
                className="demo-user-btn"
                onClick={() => handleSelectDemoUser(u)}
              >
                <div className="demo-user-title">
                  <strong>{u.label}</strong>
                  <span className="role-badge role-badge-small">{u.role}</span>
                </div>
                <div className="demo-user-creds">
                  <code>{u.username}</code> / <code>{u.pass}</code>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
