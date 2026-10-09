import { useState, type FormEvent } from "react";
import { ApiError, login, type User } from "../api";
import { IconAlert, IconSpinner } from "../components/Icons";

interface LoginPageProps {
  onLogin: (user: User, token: string) => void;
  onBack?: () => void;
  onSignup: () => void;
}

export function LoginPage({ onLogin, onBack, onSignup }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(null);
    try {
      const result = await login(email.trim(), password);
      if (!remember) localStorage.removeItem("am-pop-token");
      onLogin(result.user, result.token);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Invalid email or password" : "Login failed. Please try again.");
    } finally { setLoading(false); }
  }

  return <div className="login-page animate-fade"><div className="login-card animate-scale">
    {onBack && <button type="button" className="login-back-btn" onClick={onBack}>← Back</button>}
    <div className="login-logo">AM<span>&</span>POP</div>
    <p className="login-tagline">AI can act. AM&amp;POP decides.</p>
    <form onSubmit={handleSubmit} className="login-form">
      {error && <div className="login-error"><IconAlert size={16} /><span>{error}</span></div>}
      <div className="login-field"><label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required /></div>
      <div className="login-field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required /></div>
      <label className="form-check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
      <button type="submit" className="login-btn" disabled={loading || !email.trim() || !password}>{loading ? <><IconSpinner size={16} /> Signing in…</> : "Sign In"}</button>
    </form>
    <p className="text-muted" style={{ textAlign: "center", marginTop: "18px" }}>New to AM&amp;POP? <button type="button" className="btn-link" onClick={onSignup}>Create an account</button></p>
  </div></div>;
}
