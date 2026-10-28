import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  ApiError,
  logout,
  pingHealth,
  setClerkTokenGetter,
  updateProfile,
  verifyToken,
  type User,
  type UserRole,
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
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import { GlobalColdStartOverlay } from "./components/GlobalColdStartOverlay";
import { LandingLayout, type PublicView } from "./components/LandingLayout";
import "./App.css";

type View = "landing" | "pricing" | "customize" | "about" | "contact" | "legal" | "login" | "signup" | "forgot" | "app" | "explorer" | "settings" | "chat";

const PUBLIC_VIEWS: Set<string> = new Set(["landing", "pricing", "customize", "about", "contact", "legal"]);

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_Y3Jpc3AtdHJvbGwtNDc5Ni5jbGVyay5hY2NvdW50cy5kZXYk";

function ClerkSessionListener({ onSync }: { onSync: (user: User) => void }) {
  const { getToken, userId, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn && userId) {
      setClerkTokenGetter(() => getToken());
      void (async () => {
        try {
          let verified = await verifyToken();
          const pendingRole = localStorage.getItem("praxis-signup-role") as UserRole | null;
          const pendingInvite = localStorage.getItem("praxis-signup-invite");
          if (pendingRole || pendingInvite) {
            try {
              const updated = await updateProfile(pendingRole || undefined, pendingInvite || undefined);
              verified = updated.user;
            } catch {
              // ignore profile update error if invite code was empty/invalid
            } finally {
              localStorage.removeItem("praxis-signup-role");
              localStorage.removeItem("praxis-signup-invite");
            }
          }
          onSync(verified);
        } catch (err) {
          console.warn("Clerk session synchronization pending:", err);
        }
      })();
    } else {
      setClerkTokenGetter(null);
    }
  }, [isSignedIn, userId, getToken, onSync]);

  return null;
}

const VALID_VIEWS: Set<string> = new Set([
  "landing", "pricing", "customize", "about", "contact", "legal",
  "login", "signup", "forgot", "app", "explorer", "settings", "chat",
]);

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

function getInitialView(initialUser: User | null): View {
  try {
    const saved = localStorage.getItem("praxis-current-view") ?? sessionStorage.getItem("praxis-current-view");
    if (saved && VALID_VIEWS.has(saved)) {
      if (initialUser) {
        if (saved === "login" || saved === "signup" || saved === "forgot") {
          return initialUser.role === "explorer" || initialUser.role === "creator" ? "explorer" : "app";
        }
        return saved as View;
      }
      if (PUBLIC_VIEWS.has(saved) || saved === "login" || saved === "signup" || saved === "forgot") {
        return saved as View;
      }
    }
    if (initialUser) {
      return initialUser.role === "explorer" || initialUser.role === "creator" ? "explorer" : "app";
    }
  } catch {
    // ignore storage errors
  }
  return "landing";
}

function App() {
  const [user, setUser] = useState<User | null>(() => getInitialUser());
  const [view, setView] = useState<View>(() => getInitialView(user));

  // Listen to hash changes from Clerk's internal Sign In / Sign Up footer links (#/login, #/signup)
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash;
      if (hash.startsWith("#/login")) {
        setView("login");
      } else if (hash.startsWith("#/signup")) {
        setView("signup");
      }
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Scroll to top when view changes and persist current view in localStorage
  useEffect(() => {
    try {
      localStorage.setItem("praxis-current-view", view);
      sessionStorage.setItem("praxis-current-view", view);
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
        const savedView = localStorage.getItem("praxis-current-view");
        if (savedView && VALID_VIEWS.has(savedView)) {
          setView(savedView as View);
        }
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

  const isPublicView = PUBLIC_VIEWS.has(view);
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

        {/* ── Workspace Navigation Bar for Logged-In Users ── */}
        {user && (
          <div className="workspace-switcher-bar" role="navigation" aria-label="Workspace navigation">
            <div className="workspace-switcher-left">
              <button
                type="button"
                className={`ws-nav-pill ${view === "explorer" ? "active" : ""}`}
                onClick={() => setView("explorer")}
              >
                🧭 Customizable AI Playground
              </button>
              <button
                type="button"
                className={`ws-nav-pill ${view === "app" ? "active" : ""}`}
                onClick={() => setView("app")}
              >
                🏭 Factory Operations
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
            </div>

            <div className="workspace-switcher-right">
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
              {["technician", "researcher", "explorer", "creator"].includes(user.role) ? (
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
