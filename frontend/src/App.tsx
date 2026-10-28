import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ApiError, login, logout, pingHealth, setClerkTokenGetter, verifyToken, type User } from "./api";
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
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider, triggerToast } from "./components/Toast";
import { GlobalColdStartOverlay } from "./components/GlobalColdStartOverlay";
import { LandingLayout, type PublicView } from "./components/LandingLayout";
import "./App.css";

type View = "landing" | "pricing" | "customize" | "about" | "contact" | "legal" | "login" | "signup" | "forgot" | "app" | "explorer" | "settings" | "chat";

const PUBLIC_VIEWS: Set<string> = new Set(["landing", "pricing", "customize", "about", "contact", "legal"]);

const DEMO_ROLES: Array<{ label: string; email: string; password: string; role: string }> = [
  { label: "Technician", email: "tech@praxis.local", password: "Tech@12345!", role: "technician" },
  { label: "Maint. Supervisor", email: "maint@praxis.local", password: "Maint@12345!", role: "maintenance_supervisor" },
  { label: "Prod. Supervisor", email: "prod@praxis.local", password: "Prod@12345!", role: "production_supervisor" },
  { label: "Plant Manager", email: "plant@praxis.local", password: "Plant@12345!", role: "plant_manager" },
];

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_Y3Jpc3AtdHJvbGwtNDc5Ni5jbGVyay5hY2NvdW50cy5kZXYk";

function ClerkSessionListener({ onSync }: { onSync: (user: User) => void }) {
  const { getToken, userId, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn && userId) {
      setClerkTokenGetter(() => getToken());
      void verifyToken()
        .then((verified) => {
          onSync(verified);
        })
        .catch((err) => {
          console.warn("Clerk session synchronization pending:", err);
        });
    } else {
      setClerkTokenGetter(null);
    }
  }, [isSignedIn, userId, getToken, onSync]);

  return null;
}

function getInitialUser(): User | null {
  try {
    const hasToken = localStorage.getItem("praxis-token") || sessionStorage.getItem("praxis-token");
    if (!hasToken) return null;
    const rawUser = localStorage.getItem("praxis-user") ?? sessionStorage.getItem("praxis-user");
    if (!rawUser) return null;
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState<User | null>(() => getInitialUser());
  const [view, setView] = useState<View>("landing");
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const [ownerSubView, setOwnerSubView] = useState<"approver" | "technician">("approver");

  // Scroll to top when view changes and persist current view in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem("praxis-current-view", view);
      localStorage.removeItem("praxis-current-view");
    } catch {
      // Storage blocked or quota exceeded
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [view]);

  useEffect(() => {
    // Proactively ping health endpoint to wake up Render container
    void pingHealth();

    async function verifyBackgroundSession() {
      const hasToken = localStorage.getItem("praxis-token") || sessionStorage.getItem("praxis-token");
      if (!hasToken) return;

      try {
        const verified = await verifyToken();
        setUser(verified);
        localStorage.setItem("praxis-user", JSON.stringify(verified));
      } catch (err) {
        // Only invalidate session on explicit 401 Unauthorized (token expired or revoked)
        if (err instanceof ApiError && err.status === 401) {
          logout();
          setUser(null);
        }
      }
    }
    void verifyBackgroundSession();
  }, []);

  function handleLoginSuccess(authenticatedUser: User, token: string, persist = true) {
    setUser(authenticatedUser);
    const storage = persist ? localStorage : sessionStorage;
    storage.setItem("praxis-token", token);
    storage.setItem("praxis-user", JSON.stringify(authenticatedUser));
    localStorage.setItem("praxis-welcome", "true");
    const targetView: View =
      authenticatedUser.role === "explorer" || authenticatedUser.role === "creator"
        ? "explorer"
        : "app";
    try {
      localStorage.setItem("praxis-current-view", targetView);
    } catch {
      // ignore
    }
    setView(targetView);
  }

  function handleLogout() {
    setUser(null);
    logout();
    setClerkTokenGetter(null);
    try {
      localStorage.removeItem("praxis-current-view");
    } catch {
      // ignore
    }
    setView("login");
  }

  function handleNavigate(target: PublicView) {
    setView(target as View);
  }

  async function handleQuickRoleSwitch(demoAccount: { label: string; email: string; password: string; role: string }) {
    if (switchingRole || user?.role === demoAccount.role) {
      if (view !== "app") setView("app");
      return;
    }
    setSwitchingRole(demoAccount.role);
    try {
      const result = await login(demoAccount.email, demoAccount.password, true);
      handleLoginSuccess(result.user, result.token, true);
      triggerToast(`Switched to ${demoAccount.label} (${demoAccount.email})`, "info");
    } catch {
      triggerToast("Could not switch demo role right now. Please try again.", "error");
    } finally {
      setSwitchingRole(null);
    }
  }

  const isPublicView = PUBLIC_VIEWS.has(view);
  const isDemoUser = Boolean(
    user && (user.email.endsWith("@praxis.local") || user.email.endsWith("@ampop.local"))
  );
  const canAccessSettings = Boolean(
    user && (user.role === "plant_manager" || user.role === "business_owner" || user.is_admin)
  );

  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <ToastProvider>
        <GlobalColdStartOverlay />
        {PUBLISHABLE_KEY && (
          <ClerkSessionListener
            onSync={(syncedUser) => {
              setUser(syncedUser);
              localStorage.setItem("praxis-user", JSON.stringify(syncedUser));
              setView((prev) =>
                prev === "login" || prev === "signup"
                  ? syncedUser.role === "explorer" || syncedUser.role === "creator"
                    ? "explorer"
                    : "app"
                  : prev
              );
            }}
          />
        )}

        {/* ── Unified Workspace & Demo Role Switcher Bar for Logged-In Users ── */}
        {user && (
          <div className="workspace-switcher-bar" role="navigation" aria-label="Workspace navigation">
            <div className="workspace-switcher-left">
              <button
                type="button"
                className={`ws-nav-pill ${view === "app" ? "active" : ""}`}
                onClick={() => setView("app")}
              >
                🏭 Operations Dashboard
              </button>
              <button
                type="button"
                className={`ws-nav-pill ${view === "explorer" ? "active" : ""}`}
                onClick={() => setView("explorer")}
              >
                🧭 AI Playground
              </button>
              <button
                type="button"
                className={`ws-nav-pill ${view === "chat" ? "active" : ""}`}
                onClick={() => setView("chat")}
              >
                💬 AI Assistant
              </button>
              {canAccessSettings && (
                <button
                  type="button"
                  className={`ws-nav-pill ${view === "settings" ? "active" : ""}`}
                  onClick={() => setView("settings")}
                >
                  ⚙️ Settings
                </button>
              )}
              {user.role === "business_owner" && view === "app" && (
                <button
                  type="button"
                  className="ws-nav-pill"
                  onClick={() =>
                    setOwnerSubView((prev) => (prev === "approver" ? "technician" : "approver"))
                  }
                  title="Switch between Supervisor Queue and Issue Reporting"
                >
                  {ownerSubView === "approver" ? "➕ Report Machine Issue" : "📋 View Approval Queue"}
                </button>
              )}
            </div>

            <div className="workspace-switcher-right">
              {isDemoUser && (
                <div className="demo-role-switcher" aria-label="Quick demo role switcher">
                  <span className="demo-switcher-label">Demo Role:</span>
                  {DEMO_ROLES.map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      disabled={Boolean(switchingRole)}
                      className={`demo-role-pill ${user.role === item.role && view === "app" ? "active" : ""}`}
                      onClick={() => void handleQuickRoleSwitch(item)}
                    >
                      {switchingRole === item.role ? "Switching…" : item.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                className={`ws-nav-pill subtle ${view === "landing" ? "active" : ""}`}
                onClick={() => setView("landing")}
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
              onSignIn={() => setView("login")}
              onGetStarted={() => setView("signup")}
              currentView={view as PublicView}
            >
              {view === "landing" && (
                <ErrorBoundary fallbackTitle="Landing Page Error">
                  <LandingPage
                    onSignIn={() => setView("login")}
                    onGetStarted={() => setView("signup")}
                  />
                </ErrorBoundary>
              )}
              {view === "pricing" && (
                <ErrorBoundary fallbackTitle="Pricing Page Error">
                  <PricingPage
                    onNavigate={handleNavigate}
                    onGetStarted={() => setView("signup")}
                  />
                </ErrorBoundary>
              )}
              {view === "customize" && (
                <ErrorBoundary fallbackTitle="Customizer Error">
                  <CustomizePage
                    onNavigate={handleNavigate}
                    onGetStarted={() => setView("signup")}
                  />
                </ErrorBoundary>
              )}
              {view === "about" && (
                <ErrorBoundary fallbackTitle="About Page Error">
                  <AboutPage onNavigate={handleNavigate} onGetStarted={() => setView("signup")} />
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

          {/* ── Auth views ── */}
          {view === "login" && (
            <ErrorBoundary fallbackTitle="Login Error">
              <LoginPage
                onLogin={handleLoginSuccess}
                onBack={() => setView("landing")}
                onSignup={() => setView("signup")}
                onForgotPassword={() => setView("forgot")}
              />
            </ErrorBoundary>
          )}

          {view === "signup" && (
            <ErrorBoundary fallbackTitle="Sign Up Error">
              <SignupPage
                onSignup={handleLoginSuccess}
                onSignIn={() => setView("login")}
                onBack={() => setView("landing")}
              />
            </ErrorBoundary>
          )}

          {view === "forgot" && (
            <ErrorBoundary fallbackTitle="Password Reset Error">
              <ForgotPasswordPage onSignIn={() => setView("login")} />
            </ErrorBoundary>
          )}

          {/* ── Explorer dashboard / playground ── */}
          {view === "explorer" && user && (
            <ErrorBoundary fallbackTitle="Explorer Playground Error">
              <ExplorerPage
                user={user}
                onLogout={handleLogout}
                onOpenSettings={canAccessSettings ? () => setView("settings") : undefined}
                onOpenChat={() => setView("chat")}
              />
            </ErrorBoundary>
          )}

          {/* ── Voice AI Chat Page ── */}
          {view === "chat" && user && (
            <ErrorBoundary fallbackTitle="Voice Chat Error">
              <ChatPage
                user={user}
                onBack={() => setView(["explorer", "creator"].includes(user.role) ? "explorer" : "app")}
                onLogout={handleLogout}
              />
            </ErrorBoundary>
          )}

          {/* ── Factory dashboard ── */}
          {view === "app" && user && (
            <ErrorBoundary fallbackTitle="Dashboard Error">
              {["technician", "researcher", "explorer", "creator"].includes(user.role) ||
              (user.role === "business_owner" && ownerSubView === "technician") ? (
                <TechnicianPage
                  user={user}
                  onLogout={handleLogout}
                  onOpenSettings={canAccessSettings ? () => setView("settings") : undefined}
                />
              ) : (
                <ApproverPage
                  user={user}
                  onLogout={handleLogout}
                  onOpenSettings={canAccessSettings ? () => setView("settings") : undefined}
                />
              )}
            </ErrorBoundary>
          )}

          {/* ── Settings page ── */}
          {view === "settings" && user && (
            <ErrorBoundary fallbackTitle="Settings Error">
              <SettingsPage
                user={user}
                onBack={() => setView(["explorer", "creator"].includes(user.role) ? "explorer" : "app")}
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
