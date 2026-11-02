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
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import { GlobalColdStartOverlay } from "./components/GlobalColdStartOverlay";
import { LandingLayout, type PublicView } from "./components/LandingLayout";
import "./App.css";

const PUBLIC_PATHS: Record<PublicView, string> = { landing: "/", pricing: "/pricing", customize: "/customize", about: "/about", contact: "/contact", legal: "/legal", business: "/business", individual: "/individual", demo: "/demo", now: "/now", login: "/login", signup: "/signup" };
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
  const [demoUser, setDemoUser] = useState<User | null>(null);
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
  const handleLogout = useCallback(async () => { setDemoUser(null); logout(); setClerkTokenGetter(null); localStorage.removeItem("praxis-token"); try { await signOut(); } catch { /* demo session */ } navigate("/", { replace: true }); }, [navigate, signOut]);
  const switchDemo = useCallback(async (email: string, pass: string) => { if (switchingDemo) return; setSwitchingDemo(email); try { const result = await login(email, pass, true); setDemoUser(result.user); if (location.pathname === "/settings" && result.user.role !== "plant_manager") navigate("/app", { replace: true }); } finally { setSwitchingDemo(null); } }, [location.pathname, navigate, switchingDemo]);
  const goPublic = useCallback((view: PublicView) => navigate(PUBLIC_PATHS[view]), [navigate]);
  const publicPage = (view: PublicView, child: ReactNode) => <LandingLayout currentView={view} onNavigate={goPublic} onSignIn={() => navigate("/login")} onGetStarted={() => navigate("/signup")}>{child}</LandingLayout>;
  const dashboard = user && (["technician", "researcher", "explorer", "creator"].includes(user.role) ? <TechnicianPage user={user} onLogout={handleLogout} onOpenSettings={canAccessSettings ? () => navigate("/settings") : undefined} /> : <ApproverPage user={user} onLogout={handleLogout} onOpenSettings={canAccessSettings ? () => navigate("/settings") : undefined} />);

  if (!isLoaded) return <div className="app-loading-screen">Connecting to secure session…</div>;
  return <ErrorBoundary fallbackTitle="Application Error"><ToastProvider><GlobalColdStartOverlay />
    {user && <div className="workspace-switcher-bar" role="navigation"><div className="workspace-switcher-left"><button type="button" className="ws-nav-pill" onClick={() => navigate("/explorer")}>🧭 Customizable AI Playground</button><button type="button" className="ws-nav-pill" onClick={() => navigate("/app")}>🏭 Factory Operations</button><button type="button" className="ws-nav-pill" onClick={() => navigate("/chat")}>💬 AI Assistant</button>{canAccessSettings && <button type="button" className="ws-nav-pill" onClick={() => navigate("/settings")}>⚙️ Settings</button>}</div><div className="workspace-switcher-right">{demoUser && <div className="demo-role-switcher">{DEMO_ACCOUNTS.map((a) => <button key={a.email} type="button" className="demo-role-pill" disabled={Boolean(switchingDemo)} onClick={() => void switchDemo(a.email, a.pass)}>{switchingDemo === a.email ? "…" : a.label}</button>)}</div>}<button type="button" className="ws-nav-pill subtle" onClick={() => navigate("/")}>🌐 Home</button></div></div>}
    <Routes>
      <Route path="/" element={publicPage("landing", <LandingPage onSignIn={() => navigate("/login")} onGetStarted={() => navigate("/signup")} onNavigate={goPublic} />)} />
      <Route path="/about" element={publicPage("about", <AboutPage onNavigate={goPublic} onGetStarted={() => navigate("/signup")} />)} /><Route path="/legal" element={publicPage("legal", <LegalPage onNavigate={goPublic} />)} /><Route path="/contact" element={publicPage("contact", <ContactPage onNavigate={goPublic} />)} /><Route path="/pricing" element={publicPage("pricing", <PricingPage onNavigate={goPublic} onGetStarted={() => navigate("/signup")} />)} />
      <Route path="/demo" element={publicPage("demo", <DemoPage onDemoLogin={handleLogin} onNavigate={goPublic} />)} /><Route path="/individual" element={publicPage("individual", <IndividualPage onNavigate={goPublic} onGetStarted={() => navigate("/signup")} />)} /><Route path="/business" element={publicPage("business", <BusinessPage onNavigate={goPublic} onGetStarted={() => navigate("/signup")} />)} /><Route path="/now" element={publicPage("now", <NowPage onNavigate={goPublic} onGetStarted={() => navigate("/signup")} />)} /><Route path="/customize" element={publicPage("customize", <CustomizePage user={user} onNavigate={goPublic} onGetStarted={() => navigate("/signup")} onUpgradeSuccess={() => navigate("/app")} />)} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} onBack={() => navigate("/")} />} /><Route path="/signup" element={<SignupPage onSignup={handleLogin} onBack={() => navigate("/")} />} /><Route path="/forgot" element={<ForgotPasswordPage onSignIn={() => navigate("/login")} />} />
      <Route path="/app" element={<ProtectedRoute demoUser={demoUser}>{dashboard}</ProtectedRoute>} /><Route path="/explorer" element={<ProtectedRoute demoUser={demoUser}>{user && <ExplorerPage user={user} onLogout={handleLogout} onOpenSettings={canAccessSettings ? () => navigate("/settings") : undefined} onOpenChat={() => navigate("/chat")} />}</ProtectedRoute>} /><Route path="/settings" element={<ProtectedRoute demoUser={demoUser}>{user && <SettingsPage user={user} onBack={() => navigate(dashboardPath)} onLogout={handleLogout} />}</ProtectedRoute>} /><Route path="/chat" element={<ProtectedRoute demoUser={demoUser}>{user && <ChatPage user={user} onBack={() => navigate(dashboardPath)} onLogout={handleLogout} />}</ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </ToastProvider></ErrorBoundary>;
}

export default function App() { return <BrowserRouter><AppRoutes /></BrowserRouter>; }
