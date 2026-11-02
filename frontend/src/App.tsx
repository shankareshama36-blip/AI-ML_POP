import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { login, logout, pingHealth, setClerkTokenGetter, type User } from "./api";
import { LandingPage } from "./pages/LandingPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { LegalPage } from "./pages/LegalPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { TechnicianPage } from "./pages/TechnicianPage";
import { ApproverPage } from "./pages/ApproverPage";
import { PricingPage } from "./pages/PricingPage";
import { CustomizePage } from "./pages/CustomizePage";
import { ExplorerPage } from "./pages/ExplorerPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ChatPage } from "./pages/ChatPage";
import { DemoPage } from "./pages/DemoPage";
import { IndividualPage } from "./pages/IndividualPage";
import { BusinessPage } from "./pages/BusinessPage";
import { NowPage } from "./pages/NowPage";
import { EvaluatorPage } from "./pages/EvaluatorPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import { GlobalColdStartOverlay } from "./components/GlobalColdStartOverlay";
import { LandingLayout, type PublicView } from "./components/LandingLayout";
import "./App.css";

const PUBLIC_PATHS: Record<PublicView, string> = { landing: "/", pricing: "/pricing", customize: "/customize", about: "/about", contact: "/contact", legal: "/legal", business: "/business", individual: "/individual", demo: "/demo", now: "/now", evaluator: "/evaluator", login: "/login", signup: "/signup" };
const DEMO_ACCOUNTS = [{ label: "Tech", email: "tech@praxis.local", pass: "Tech@12345!" }, { label: "Maint Sup", email: "maint@praxis.local", pass: "Maint@12345!" }, { label: "Prod Sup", email: "prod@praxis.local", pass: "Prod@12345!" }, { label: "Plant Mgr", email: "plant@praxis.local", pass: "Plant@12345!" }];

function ProtectedRoute({ children, demoUser }: { children: ReactNode; demoUser: User | null }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  if (!isLoaded) return <div className="app-loading-screen">Connecting to secure session…</div>;
  return isSignedIn || demoUser ? <>{children}</> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function AppRoutes() {
  const { getToken, isLoaded, isSignedIn: clerkIsSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [demoUser, setDemoUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const isEval = localStorage.getItem("praxis-evaluator-mode") === "true";
    const path = window.location.pathname;
    if (isEval || path === "/app" || path === "/explorer") {
      return {
        id: 4,
        email: "plant@praxis.local",
        role: "plant_manager",
        tenant_id: "00000000-0000-0000-0000-000000000001",
        company_name: "Praxis Main Plant",
        is_admin: true,
        is_evaluator: true,
      };
    }
    return null;
  });
  const [switchingDemo, setSwitchingDemo] = useState<string | null>(null);
  const clerkAppUser = useMemo<User>(() => ({ id: 1, email: clerkUser?.primaryEmailAddress?.emailAddress || `${userId || "user"}@clerk.user`, role: (clerkUser?.publicMetadata?.role as string) || "explorer", tenant_id: "00000000-0000-0000-0000-000000000001", company_name: "Praxis Main Plant", is_admin: Boolean(clerkUser?.publicMetadata?.role === "plant_manager" || clerkUser?.publicMetadata?.role === "business_owner"), clerk_user_id: userId || undefined }), [clerkUser, userId]);
  const user = clerkIsSignedIn ? clerkAppUser : demoUser;
  const dashboardPath = user?.role === "explorer" || user?.role === "creator" ? "/explorer" : "/app";
  const canAccessSettings = Boolean(user && (user.role === "plant_manager" || user.role === "business_owner" || user.is_admin));

  useEffect(() => { setClerkTokenGetter(clerkIsSignedIn ? () => getToken() : null); }, [clerkIsSignedIn, getToken]);
  useEffect(() => { void pingHealth(); }, []);
  useEffect(() => { if (isLoaded && clerkIsSignedIn && ["/login", "/signup", "/forgot"].includes(location.pathname)) navigate(dashboardPath, { replace: true }); }, [clerkIsSignedIn, dashboardPath, isLoaded, location.pathname, navigate]);

  const handleLogin = useCallback((authenticatedUser: User, token?: string) => {
    if (token) localStorage.setItem("praxis-token", token);
    if (authenticatedUser?.role) setDemoUser(authenticatedUser);
    const role = authenticatedUser?.role || user?.role;
    navigate(role === "explorer" || role === "creator" ? "/explorer" : "/app", { replace: true });
  }, [navigate, user?.role]);
  const handleLogout = useCallback(async () => {
    setDemoUser(null);
    logout();
    setClerkTokenGetter(null);
    localStorage.removeItem("praxis-token");
    localStorage.removeItem("praxis-evaluator-mode");
    try { await signOut(); } catch { /* demo session */ }
    navigate("/", { replace: true });
  }, [navigate, signOut]);
  const handleSuperAdminLogin = useCallback(async () => {
    localStorage.setItem("praxis-evaluator-mode", "true");
    try {
      const result = await login("plant@praxis.local", "Plant@12345!", true);
      const evalUser: User = {
        ...result.user,
        is_admin: true,
        is_evaluator: true,
      };
      handleLogin(evalUser, result.token);
    } catch (err) {
      console.warn("Backend login failed, using direct Super Admin evaluator session", err);
      const fallbackUser: User = {
        id: 4,
        email: "plant@praxis.local",
        role: "plant_manager",
        tenant_id: "00000000-0000-0000-0000-000000000001",
        company_name: "Praxis Main Plant",
        is_admin: true,
        is_evaluator: true,
      };
      handleLogin(fallbackUser);
    }
  }, [handleLogin]);
  const isEvaluator = Boolean(user?.is_evaluator || localStorage.getItem("praxis-evaluator-mode") === "true");

  const handleEvaluatorRoleSwitch = useCallback(async (targetRole: string) => {
    if (switchingDemo) return;
    setSwitchingDemo(targetRole);

    const roleConfigs: Record<string, { email: string; pass: string; defaultPath: string }> = {
      plant_manager: { email: "plant@praxis.local", pass: "Plant@12345!", defaultPath: "/app" },
      technician: { email: "tech@praxis.local", pass: "Tech@12345!", defaultPath: "/app" },
      explorer: { email: "researcher@praxis.local", pass: "Research@12345!", defaultPath: "/explorer" },
      maintenance_supervisor: { email: "maint@praxis.local", pass: "Maint@12345!", defaultPath: "/app" },
      production_supervisor: { email: "prod@praxis.local", pass: "Prod@12345!", defaultPath: "/app" },
    };

    const config = roleConfigs[targetRole] || roleConfigs["plant_manager"];

    try {
      const res = await login(config.email, config.pass, true);
      setDemoUser({
        ...res.user,
        is_evaluator: true,
        is_admin: targetRole === "plant_manager",
      });
    } catch {
      setDemoUser({
        id: targetRole === "plant_manager" ? 4 : (targetRole === "technician" ? 1 : 2),
        email: config.email,
        role: targetRole,
        tenant_id: "00000000-0000-0000-0000-000000000001",
        company_name: "Praxis Main Plant",
        is_evaluator: true,
        is_admin: targetRole === "plant_manager",
      });
    } finally {
      setSwitchingDemo(null);
    }

    if (targetRole === "explorer" || targetRole === "creator") {
      navigate("/explorer", { replace: true });
    } else {
      navigate("/app", { replace: true });
    }
  }, [navigate, switchingDemo]);

  const handleOpenApp = useCallback(async () => {
    if (user) {
      navigate(dashboardPath);
      return;
    }
    await handleSuperAdminLogin();
  }, [dashboardPath, handleSuperAdminLogin, navigate, user]);

  const switchDemo = useCallback(async (email: string, pass: string) => { if (switchingDemo) return; setSwitchingDemo(email); try { const result = await login(email, pass, true); setDemoUser(result.user); if (location.pathname === "/settings" && result.user.role !== "plant_manager") navigate("/app", { replace: true }); } finally { setSwitchingDemo(null); } }, [location.pathname, navigate, switchingDemo]);
  const goPublic = useCallback((view: PublicView) => navigate(PUBLIC_PATHS[view]), [navigate]);
  const publicPage = (view: PublicView, child: ReactNode) => <LandingLayout currentView={view} onNavigate={goPublic} onSignIn={() => navigate("/login")} onGetStarted={() => navigate("/signup")} onOpenApp={handleOpenApp}>{child}</LandingLayout>;
  const dashboard = user && (["technician", "researcher", "explorer", "creator"].includes(user.role) ? <TechnicianPage user={user} onLogout={handleLogout} onOpenSettings={canAccessSettings ? () => navigate("/settings") : undefined} /> : <ApproverPage user={user} onLogout={handleLogout} onOpenSettings={canAccessSettings ? () => navigate("/settings") : undefined} />);

  if (!isLoaded) return <div className="app-loading-screen">Connecting to secure session…</div>;
  return <ErrorBoundary fallbackTitle="Application Error"><ToastProvider><GlobalColdStartOverlay />
    {user && isEvaluator && (
      <aside className="evaluator-sticky-banner" aria-label="Evaluator Super Admin Banner">
        <div className="evaluator-banner-left">
          <span className="evaluator-banner-badge">🎓 Evaluator Mode Active</span>
          <span className="evaluator-banner-text">You have Super Admin access.</span>
        </div>
        <div className="evaluator-banner-right">
          <label htmlFor="eval-sticky-role-select" className="evaluator-role-label">Role Switcher:</label>
          <select
            id="eval-sticky-role-select"
            className="evaluator-role-select"
            value={user.role}
            disabled={Boolean(switchingDemo)}
            onChange={(e) => void handleEvaluatorRoleSwitch(e.target.value)}
          >
            <option value="plant_manager">🛡️ Manager (Plant Manager - Super Admin)</option>
            <option value="technician">🏭 Technician (Floor Operations)</option>
            <option value="explorer">🧭 Explorer (AI Playground)</option>
            <option value="maintenance_supervisor">📋 Maintenance Supervisor</option>
            <option value="production_supervisor">📈 Production Supervisor</option>
          </select>
          <button
            type="button"
            className="evaluator-banner-exit"
            onClick={() => navigate("/evaluator")}
          >
            Academic Dashboard &rarr;
          </button>
        </div>
      </aside>
    )}
    {user && <div className="workspace-switcher-bar" role="navigation"><div className="workspace-switcher-left">{isEvaluator && <span className="evaluator-mode-pill">🎓 Evaluator Mode (Super Admin)</span>}<button type="button" className="ws-nav-pill" onClick={() => navigate("/explorer")}>🧭 Customizable AI Playground</button><button type="button" className="ws-nav-pill" onClick={() => navigate("/app")}>🏭 Factory Operations</button><button type="button" className="ws-nav-pill" onClick={() => navigate("/chat")}>💬 AI Assistant</button>{canAccessSettings && <button type="button" className="ws-nav-pill" onClick={() => navigate("/settings")}>⚙️ Settings</button>}</div><div className="workspace-switcher-right">{isEvaluator ? (<div className="evaluator-navbar-role-wrap"><label htmlFor="eval-nav-role-select" className="eval-navbar-label">Role Switcher:</label><select id="eval-nav-role-select" className="eval-navbar-select" value={user.role} disabled={Boolean(switchingDemo)} onChange={(e) => void handleEvaluatorRoleSwitch(e.target.value)}><option value="plant_manager">🛡️ Manager</option><option value="technician">🏭 Technician</option><option value="explorer">🧭 Explorer</option><option value="maintenance_supervisor">📋 Maint Sup</option><option value="production_supervisor">📈 Prod Sup</option></select></div>) : (demoUser && <div className="demo-role-switcher">{DEMO_ACCOUNTS.map((a) => <button key={a.email} type="button" className="demo-role-pill" disabled={Boolean(switchingDemo)} onClick={() => void switchDemo(a.email, a.pass)}>{switchingDemo === a.email ? "…" : a.label}</button>)}</div>)}<button type="button" className="ws-nav-pill subtle" onClick={() => navigate("/")}>🌐 Home</button></div></div>}
    <Routes>
      <Route path="/" element={publicPage("landing", <LandingPage onSignIn={() => navigate("/login")} onGetStarted={() => navigate("/signup")} onNavigate={goPublic} />)} />
      <Route path="/evaluator" element={publicPage("evaluator", <EvaluatorPage onLaunchSuperAdmin={handleSuperAdminLogin} onNavigate={goPublic} />)} />
      <Route path="/about" element={publicPage("about", <AboutPage onNavigate={goPublic} onGetStarted={() => navigate("/signup")} />)} /><Route path="/legal" element={publicPage("legal", <LegalPage onNavigate={goPublic} />)} /><Route path="/contact" element={publicPage("contact", <ContactPage onNavigate={goPublic} />)} /><Route path="/pricing" element={publicPage("pricing", <PricingPage onNavigate={goPublic} onGetStarted={() => navigate("/signup")} />)} />
      <Route path="/demo" element={publicPage("demo", <DemoPage onDemoLogin={handleLogin} onNavigate={goPublic} />)} /><Route path="/individual" element={publicPage("individual", <IndividualPage onNavigate={goPublic} onGetStarted={() => navigate("/signup")} />)} /><Route path="/business" element={publicPage("business", <BusinessPage onNavigate={goPublic} onGetStarted={() => navigate("/signup")} />)} /><Route path="/now" element={publicPage("now", <NowPage onNavigate={goPublic} onGetStarted={() => navigate("/signup")} />)} /><Route path="/customize" element={publicPage("customize", <CustomizePage user={user} onNavigate={goPublic} onGetStarted={() => navigate("/signup")} onUpgradeSuccess={() => navigate("/app")} />)} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} onBack={() => navigate("/")} />} /><Route path="/signup" element={<SignupPage onSignup={handleLogin} onBack={() => navigate("/")} />} /><Route path="/forgot" element={<ForgotPasswordPage onSignIn={() => navigate("/login")} />} />
      <Route path="/app" element={<ProtectedRoute demoUser={demoUser}>{dashboard}</ProtectedRoute>} /><Route path="/explorer" element={<ProtectedRoute demoUser={demoUser}>{user && <ExplorerPage user={user} onLogout={handleLogout} onOpenSettings={canAccessSettings ? () => navigate("/settings") : undefined} onOpenChat={() => navigate("/chat")} />}</ProtectedRoute>} /><Route path="/settings" element={<ProtectedRoute demoUser={demoUser}>{user && <SettingsPage user={user} onBack={() => navigate(dashboardPath)} onLogout={handleLogout} />}</ProtectedRoute>} /><Route path="/chat" element={<ProtectedRoute demoUser={demoUser}>{user && <ChatPage user={user} onBack={() => navigate(dashboardPath)} onLogout={handleLogout} />}</ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </ToastProvider></ErrorBoundary>;
}

export default function App() { return <BrowserRouter><AppRoutes /></BrowserRouter>; }
