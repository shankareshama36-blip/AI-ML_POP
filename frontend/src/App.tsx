import { useState, useEffect } from "react";
import { ApiError, logout, pingHealth, verifyToken, type User } from "./api";
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

function App() {
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [restoringSession, setRestoringSession] = useState(true);

  // Persist current view state in localStorage whenever it changes
  useEffect(() => {
    if (!restoringSession) {
      try {
        localStorage.setItem("praxis-current-view", view);
      } catch {
        // Storage blocked or quota exceeded
      }
    }
  }, [view, restoringSession]);

  useEffect(() => {
    // Proactively ping health endpoint to wake up Render container
    void pingHealth();

    async function restoreSession() {
      const hasToken = localStorage.getItem("praxis-token") || sessionStorage.getItem("praxis-token");
      const savedView = localStorage.getItem("praxis-current-view") as View | null;

      if (!hasToken) {
        if (savedView && (PUBLIC_VIEWS.has(savedView) || ["login", "signup", "forgot"].includes(savedView))) {
          setView(savedView);
        } else {
          setView(localStorage.getItem("praxis-welcome") ? "login" : "landing");
        }
        setRestoringSession(false);
        return;
      }

      try {
        const verified = await verifyToken();
        setUser(verified);
        localStorage.setItem("praxis-user", JSON.stringify(verified));

        const isExplorer = verified.role === "explorer" || verified.role === "creator";
        if (savedView && (savedView === "settings" || savedView === "explorer" || savedView === "chat" || savedView === "app" || PUBLIC_VIEWS.has(savedView))) {
          setView(savedView);
        } else {
          setView(isExplorer ? "explorer" : "app");
        }
      } catch (err) {
        // Only invalidate session on explicit 401 Unauthorized (token expired or revoked)
        if (err instanceof ApiError && err.status === 401) {
          logout();
          try {
            localStorage.removeItem("praxis-current-view");
          } catch {
            // ignore
          }
          setView("login");
        } else {
          // If server is cold-starting or temporarily offline, restore from cached user
          const cachedUserStr = localStorage.getItem("praxis-user") ?? sessionStorage.getItem("praxis-user");
          if (cachedUserStr) {
            try {
              const cachedUser = JSON.parse(cachedUserStr) as User;
              setUser(cachedUser);
              const isExplorer = cachedUser.role === "explorer" || cachedUser.role === "creator";
              if (savedView && (savedView === "settings" || savedView === "explorer" || savedView === "chat" || savedView === "app" || PUBLIC_VIEWS.has(savedView))) {
                setView(savedView);
              } else {
                setView(isExplorer ? "explorer" : "app");
              }
              return;
            } catch {
              // Ignore parse error
            }
          }
          if (savedView && PUBLIC_VIEWS.has(savedView)) {
            setView(savedView);
          } else {
            setView(localStorage.getItem("praxis-welcome") ? "login" : "landing");
          }
        }
      } finally {
        setRestoringSession(false);
      }
    }
    void restoreSession();
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

  if (restoringSession) return null;

  const isPublicView = PUBLIC_VIEWS.has(view);

  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <ToastProvider>
        <GlobalColdStartOverlay />
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
              <SignupPage onSignup={handleLoginSuccess} onSignIn={() => setView("login")} />
            </ErrorBoundary>
          )}

          {view === "forgot" && (
            <ErrorBoundary fallbackTitle="Password Reset Error">
              <ForgotPasswordPage onSignIn={() => setView("login")} />
            </ErrorBoundary>
          )}

          {/* ── Explorer dashboard / playground ── */}
          {((view === "explorer" || (view === "app" && ["explorer", "creator"].includes(user?.role || ""))) && user) && (
            <ErrorBoundary fallbackTitle="Explorer Playground Error">
              <ExplorerPage
                user={user}
                onLogout={handleLogout}
                onOpenSettings={user.is_admin ? () => setView("settings") : undefined}
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
          {view === "app" && user && !["explorer", "creator"].includes(user.role) && (
            <ErrorBoundary fallbackTitle="Dashboard Error">
              {["technician", "researcher"].includes(user.role) ? (
                <TechnicianPage
                  user={user}
                  onLogout={handleLogout}
                  onOpenSettings={
                    user.is_admin ? () => setView("settings") : undefined
                  }
                />
              ) : (
                <ApproverPage
                  user={user}
                  onLogout={handleLogout}
                  onOpenSettings={
                    user.role === "plant_manager" || user.role === "business_owner" || Boolean(user.is_admin)
                      ? () => setView("settings")
                      : undefined
                  }
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
