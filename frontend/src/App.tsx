import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import {
  login,
  logout,
  pingHealth,
  setClerkTokenGetter,
  type User,
} from "./api";

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

type View =
  | "landing"
  | "pricing"
  | "customize"
  | "about"
  | "contact"
  | "legal"
  | "business"
  | "individual"
  | "demo"
  | "now"
  | "login"
  | "signup"
  | "forgot"
  | "app"
  | "explorer"
  | "settings"
  | "chat";

const PUBLIC_VIEWS: Set<string> = new Set([
  "landing",
  "pricing",
  "customize",
  "about",
  "contact",
  "legal",
  "business",
  "individual",
  "demo",
  "now",
]);

const PROTECTED_VIEWS: Set<string> = new Set([
  "app",
  "explorer",
  "settings",
  "chat",
]);

const DEMO_SWITCH_ACCOUNTS = [
  { label: "Tech", email: "tech@praxis.local", pass: "Tech@12345!" },
  { label: "Maint Sup", email: "maint@praxis.local", pass: "Maint@12345!" },
  { label: "Prod Sup", email: "prod@praxis.local", pass: "Prod@12345!" },
  { label: "Plant Mgr", email: "plant@praxis.local", pass: "Plant@12345!" },
];

const VALID_VIEWS: Set<string> = new Set([
  "landing",
  "pricing",
  "customize",
  "about",
  "contact",
  "legal",
  "business",
  "individual",
  "demo",
  "now",
  "login",
  "signup",
  "forgot",
  "app",
  "explorer",
  "settings",
  "chat",
]);

function getInitialView(isSignedIn?: boolean): View {
  try {
    if (typeof window !== "undefined") {
      // 1. If isSignedIn (from Clerk) is true: Check localStorage for protected view
      if (isSignedIn) {
        const saved = localStorage.getItem("praxis-current-view");
        if (saved && PROTECTED_VIEWS.has(saved)) {
          return saved as View;
        }
        const path = window.location.pathname.replace(/^\//, "").trim();
        if (path && PROTECTED_VIEWS.has(path)) {
          return path as View;
        }
        return "app";
      }

      // 2. If isSignedIn is false: ALWAYS return "landing"
      return "landing";
    }
  } catch {
    // ignore storage or window errors
  }
  return "landing";
}

function App() {
  const { getToken, userId, isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const [demoUser, setDemoUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(() => getInitialView(isSignedIn));
  const [switchingDemo, setSwitchingDemo] = useState<string | null>(null);

  // Synchronize view state with browser URL, history, and localStorage
  const changeView = useCallback((newView: View, replace = false) => {
    setView(newView);
    try {
      localStorage.setItem("praxis-current-view", newView);
      sessionStorage.setItem("praxis-current-view", newView);
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      const path = newView === "landing" ? "/" : `/${newView}`;
      if (window.location.pathname !== path) {
        if (replace) {
          window.history.replaceState({ view: newView }, "", path);
        } else {
          window.history.pushState({ view: newView }, "", path);
        }
      }
    }
  }, []);

  // Listen to browser Back and Forward navigation (popstate)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentPath = view === "landing" ? "/" : `/${view}`;
      if (!window.history.state || window.history.state.view !== view) {
        window.history.replaceState({ view }, "", currentPath);
      }
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state === "object" && "view" in event.state) {
        const targetView = event.state.view;
        if (typeof targetView === "string" && VALID_VIEWS.has(targetView)) {
          setView(targetView as View);
          return;
        }
      }
      const path = window.location.pathname.replace(/^\//, "").trim();
      if (path && VALID_VIEWS.has(path)) {
        setView(path as View);
      } else {
        setView("landing");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [view]);

  // Derive active user strictly from Clerk authentication state
  const clerkAppUser: User = {
    id: 1,
    email: clerkUser?.primaryEmailAddress?.emailAddress || `${userId || "user"}@clerk.user`,
    role: (clerkUser?.publicMetadata?.role as string) || "explorer",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    company_name: "Praxis Main Plant",
    is_admin: Boolean(
      clerkUser?.publicMetadata?.role === "plant_manager" ||
      clerkUser?.publicMetadata?.role === "business_owner"
    ),
    clerk_user_id: userId || undefined,
  };

  const user: User | null = isSignedIn ? clerkAppUser : demoUser;

  // Single authority for auth routing: strictly dependent on [isLoaded, isSignedIn]
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      setClerkTokenGetter(() => getToken());
      setView((prev) => {
        // If localStorage has a saved protected view, restore it
        const saved = typeof window !== "undefined" ? localStorage.getItem("praxis-current-view") : null;
        if (saved && PROTECTED_VIEWS.has(saved)) {
          if (typeof window !== "undefined") {
            const path = `/${saved}`;
            if (window.location.pathname !== path) {
              window.history.replaceState({ view: saved }, "", path);
            }
          }
          return saved as View;
        }

        // Check if current URL pathname is a protected view
        const path = typeof window !== "undefined" ? window.location.pathname.replace(/^\//, "").trim() : "";
        if (path && PROTECTED_VIEWS.has(path)) {
          return path as View;
        }

        // If user is on an auth or landing page upon login, route to dashboard
        if (
          prev === "landing" ||
          prev === "login" ||
          prev === "signup" ||
          prev === "forgot"
        ) {
          const defaultDash: View = "app";
          if (typeof window !== "undefined") {
            window.history.replaceState({ view: defaultDash }, "", `/${defaultDash}`);
          }
          return defaultDash;
        }
        return prev;
      });
    } else {
      setClerkTokenGetter(null);
      setView((prev) => {
        if (PROTECTED_VIEWS.has(prev)) {
          if (typeof window !== "undefined") {
            window.history.replaceState({ view: "landing" }, "", "/");
          }
          return "landing";
        }
        return prev;
      });
    }
  }, [isLoaded, isSignedIn]);

  // Proactively ping health endpoint to wake up Render container
  useEffect(() => {
    void pingHealth();
  }, []);

  // Sync view to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem("praxis-current-view", view);
      sessionStorage.setItem("praxis-current-view", view);
    } catch {
      // Storage blocked or quota exceeded
    }
  }, [view]);

  // Listen to hash changes from Clerk's internal footer links (#/login, #/signup)
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash;
      if (hash.startsWith("#/login") && !isSignedIn) {
        changeView("login");
      } else if (hash.startsWith("#/signup") && !isSignedIn) {
        changeView("signup");
      }
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [isSignedIn, changeView]);

  // Exact scroll restoration across page reloads using sessionStorage
  useEffect(() => {
    const savedPos = sessionStorage.getItem("praxis-scroll-pos");
    if (savedPos) {
      const targetY = parseInt(savedPos, 10);
      if (!Number.isNaN(targetY) && targetY > 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, targetY);
        });
      }
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          try {
            sessionStorage.setItem("praxis-scroll-pos", window.scrollY.toString());
          } catch {
            // ignore
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // When view changes to a different page, reset scroll to top
  const prevViewRef = useRef(view);
  useEffect(() => {
    if (prevViewRef.current !== view) {
      prevViewRef.current = view;
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
        try {
          sessionStorage.setItem("praxis-scroll-pos", "0");
        } catch {
          // ignore
        }
      }
    }
  }, [view]);

  function handleLoginSuccess(authenticatedUser: User) {
    setDemoUser(authenticatedUser);
    changeView("app");
  }

  async function handleDemoRoleSwitch(email: string, pass: string) {
    if (user?.email === email || switchingDemo) return;
    setSwitchingDemo(email);
    try {
      const res = await login(email, pass, true);
      setDemoUser(res.user);
      if (view === "settings" && res.user.role !== "plant_manager") {
        changeView("app");
      } else if (!PROTECTED_VIEWS.has(view)) {
        changeView("app");
      }
    } catch (err) {
      console.error("Failed to switch demo account:", err);
    } finally {
      setSwitchingDemo(null);
    }
  }

  async function handleLogout() {
    setDemoUser(null);
    logout();
    setClerkTokenGetter(null);
    try {
      localStorage.removeItem("praxis-current-view");
      sessionStorage.removeItem("praxis-current-view");
      sessionStorage.removeItem("praxis-scroll-pos");
      await signOut();
    } catch {
      // ignore
    }
    changeView("landing", true);
  }

  function handleNavigate(target: PublicView) {
    changeView(target as View);
  }

  // 1. If Clerk is not loaded yet, return a clean loading spinner without redirecting
  if (!isLoaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0f1d",
          color: "#94a3b8",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="coldstart-spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: "14px", fontWeight: 500 }}>Connecting to secure session…</p>
        </div>
      </div>
    );
  }

  const isPublicView = PUBLIC_VIEWS.has(view);
  const canAccessSettings = Boolean(
    user && (user.role === "plant_manager" || user.role === "business_owner" || user.is_admin)
  );
  const isDemoAccount = Boolean(user && user.email.endsWith("@praxis.local"));

  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <ToastProvider>
        <GlobalColdStartOverlay />

        {/* ── Workspace Navigation Bar for Logged-In Users ── */}
        {user && (
          <div className="workspace-switcher-bar" role="navigation" aria-label="Workspace navigation">
            <div className="workspace-switcher-left">
              <button
                type="button"
                className={`ws-nav-pill ${view === "explorer" ? "active" : ""}`}
                onClick={() => changeView("explorer")}
              >
                🧭 Customizable AI Playground
              </button>
              <button
                type="button"
                className={`ws-nav-pill ${view === "app" ? "active" : ""}`}
                onClick={() => changeView("app")}
              >
                🏭 Factory Operations
              </button>
              <button
                type="button"
                className={`ws-nav-pill ${view === "chat" ? "active" : ""}`}
                onClick={() => changeView("chat")}
              >
                💬 AI Assistant
              </button>
              {canAccessSettings && (
                <button
                  type="button"
                  className={`ws-nav-pill ${view === "settings" ? "active" : ""}`}
                  onClick={() => changeView("settings")}
                >
                  ⚙️ Settings
                </button>
              )}
            </div>

            <div className="workspace-switcher-right">
              {isDemoAccount && (
                <div className="demo-role-switcher" aria-label="Switch Demo Account Role">
                  <span className="demo-switcher-label">Demo Role:</span>
                  {DEMO_SWITCH_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      className={`demo-role-pill ${user.email === acc.email ? "active" : ""}`}
                      onClick={() => void handleDemoRoleSwitch(acc.email, acc.pass)}
                      disabled={Boolean(switchingDemo)}
                      title={`Switch to ${acc.email}`}
                    >
                      {switchingDemo === acc.email ? "…" : acc.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                className={`ws-nav-pill subtle ${view === "landing" ? "active" : ""}`}
                onClick={() => changeView("landing")}
              >
                🌐 Home
              </button>
            </div>
          </div>
        )}

        <div key={view} className="view-transition">
          {/* ── Public views wrapped in shared LandingLayout nav + footer ── */}
          {isPublicView && (
            <LandingLayout
              onNavigate={handleNavigate}
              onSignIn={() => changeView("login")}
              onGetStarted={() => changeView("signup")}
              currentView={view as PublicView}
            >
              {view === "landing" && (
                <ErrorBoundary fallbackTitle="Landing Page Error">
                  <LandingPage
                    onSignIn={() => changeView("login")}
                    onGetStarted={() => changeView("signup")}
                    onNavigate={handleNavigate}
                  />
                </ErrorBoundary>
              )}
              {view === "demo" && (
                <ErrorBoundary fallbackTitle="Demo Sandbox Error">
                  <DemoPage
                    onDemoLogin={handleLoginSuccess}
                    onNavigate={handleNavigate}
                  />
                </ErrorBoundary>
              )}
              {view === "individual" && (
                <ErrorBoundary fallbackTitle="Individual Page Error">
                  <IndividualPage
                    onNavigate={handleNavigate}
                    onGetStarted={() => changeView("signup")}
                  />
                </ErrorBoundary>
              )}
              {view === "business" && (
                <ErrorBoundary fallbackTitle="Business Page Error">
                  <BusinessPage
                    onNavigate={handleNavigate}
                    onGetStarted={() => changeView("signup")}
                  />
                </ErrorBoundary>
              )}
              {view === "now" && (
                <ErrorBoundary fallbackTitle="Manifesto Error">
                  <NowPage
                    onNavigate={handleNavigate}
                    onGetStarted={() => changeView("signup")}
                  />
                </ErrorBoundary>
              )}
              {view === "pricing" && (
                <ErrorBoundary fallbackTitle="Pricing Page Error">
                  <PricingPage
                    onNavigate={handleNavigate}
                    onGetStarted={() => changeView("signup")}
                  />
                </ErrorBoundary>
              )}
              {view === "customize" && (
                <ErrorBoundary fallbackTitle="Customizer Error">
                  <CustomizePage
                    user={user}
                    onNavigate={handleNavigate}
                    onGetStarted={() => changeView("signup")}
                    onUpgradeSuccess={() => changeView("app")}
                  />
                </ErrorBoundary>
              )}
              {view === "about" && (
                <ErrorBoundary fallbackTitle="About Page Error">
                  <AboutPage onNavigate={handleNavigate} onGetStarted={() => changeView("signup")} />
                </ErrorBoundary>
              )}
              {view === "contact" && (
                <ErrorBoundary fallbackTitle="Contact Page Error">
                  <ContactPage onNavigate={handleNavigate} />
                </ErrorBoundary>
              )}
              {view === "legal" && (
                <ErrorBoundary fallbackTitle="Legal Page Error">
                  <LegalPage onNavigate={handleNavigate} />
                </ErrorBoundary>
              )}
            </LandingLayout>
          )}

          {/* ── Auth views (only rendered when user is NOT signed in) ── */}
          {!isSignedIn && (view === "login" || (PROTECTED_VIEWS.has(view) && !user)) && (
            <ErrorBoundary fallbackTitle="Login Error">
              <LoginPage
                onLogin={handleLoginSuccess}
                onBack={() => changeView("landing")}
                onSignup={() => changeView("signup")}
                onForgotPassword={() => changeView("forgot")}
              />
            </ErrorBoundary>
          )}

          {!isSignedIn && view === "signup" && (
            <ErrorBoundary fallbackTitle="Sign Up Error">
              <SignupPage
                onSignup={handleLoginSuccess}
                onSignIn={() => changeView("login")}
                onBack={() => changeView("landing")}
              />
            </ErrorBoundary>
          )}

          {!isSignedIn && view === "forgot" && (
            <ErrorBoundary fallbackTitle="Password Reset Error">
              <ForgotPasswordPage onSignIn={() => changeView("login")} />
            </ErrorBoundary>
          )}

          {/* ── Explorer dashboard / playground ── */}
          {view === "explorer" && user && (
            <ErrorBoundary fallbackTitle="Explorer Playground Error">
              <ExplorerPage
                user={user}
                onLogout={handleLogout}
                onOpenSettings={canAccessSettings ? () => changeView("settings") : undefined}
                onOpenChat={() => changeView("chat")}
              />
            </ErrorBoundary>
          )}

          {/* ── Voice AI Chat Page ── */}
          {view === "chat" && user && (
            <ErrorBoundary fallbackTitle="Voice Chat Error">
              <ChatPage
                user={user}
                onBack={() => changeView(["explorer", "creator"].includes(user.role) ? "explorer" : "app")}
                onLogout={handleLogout}
              />
            </ErrorBoundary>
          )}

          {/* ── Factory dashboard ── */}
          {view === "app" && user && (
            <ErrorBoundary fallbackTitle="Dashboard Error">
              {["technician", "researcher", "explorer", "creator"].includes(user.role) ? (
                <TechnicianPage
                  user={user}
                  onLogout={handleLogout}
                  onOpenSettings={canAccessSettings ? () => changeView("settings") : undefined}
                />
              ) : (
                <ApproverPage
                  user={user}
                  onLogout={handleLogout}
                  onOpenSettings={canAccessSettings ? () => changeView("settings") : undefined}
                />
              )}
            </ErrorBoundary>
          )}

          {/* ── Settings page ── */}
          {view === "settings" && user && (
            <ErrorBoundary fallbackTitle="Settings Error">
              <SettingsPage
                user={user}
                onBack={() => changeView(["explorer", "creator"].includes(user.role) ? "explorer" : "app")}
                onLogout={handleLogout}
              />
            </ErrorBoundary>
          )}
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
