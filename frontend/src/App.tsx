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
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import { GlobalColdStartOverlay } from "./components/GlobalColdStartOverlay";
import { LandingLayout, type PublicView } from "./components/LandingLayout";
import "./App.css";

type View = "landing" | "about" | "contact" | "legal" | "login" | "signup" | "forgot" | "app";

const PUBLIC_VIEWS: Set<string> = new Set(["landing", "about", "contact", "legal"]);

function App() {
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [restoringSession, setRestoringSession] = useState(true);

  useEffect(() => {
    // Proactively ping health endpoint to wake up Render container
    void pingHealth();

    async function restoreSession() {
      const hasToken = localStorage.getItem("praxis-token") || sessionStorage.getItem("praxis-token");
      if (!hasToken) {
        setView(localStorage.getItem("praxis-welcome") ? "login" : "landing");
        setRestoringSession(false);
        return;
      }

      try {
        const verified = await verifyToken();
        setUser(verified);
        localStorage.setItem("praxis-user", JSON.stringify(verified));
        setView("app");
      } catch (err) {
        // Only invalidate session on explicit 401 Unauthorized (token expired or revoked)
        if (err instanceof ApiError && err.status === 401) {
          logout();
          setView("login");
        } else {
          // If server is cold-starting or temporarily offline, restore from cached user
          const cachedUserStr = localStorage.getItem("praxis-user") ?? sessionStorage.getItem("praxis-user");
          if (cachedUserStr) {
            try {
              const cachedUser = JSON.parse(cachedUserStr) as User;
              setUser(cachedUser);
              setView("app");
              return;
            } catch {
              // Ignore parse error
            }
          }
          setView(localStorage.getItem("praxis-welcome") ? "login" : "landing");
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
    setView("app");
  }

  function handleLogout() {
    setUser(null);
    logout();
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

          {/* ── App dashboard ── */}
          {view === "app" && user && (
            <ErrorBoundary fallbackTitle="Dashboard Error">
              {user.role === "technician" ? (
                <TechnicianPage user={user} onLogout={handleLogout} />
              ) : (
                <ApproverPage user={user} onLogout={handleLogout} />
              )}
            </ErrorBoundary>
          )}
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
