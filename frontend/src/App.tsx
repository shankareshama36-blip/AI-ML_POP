import { useState, useEffect } from "react";
import { logout, verifyToken, type User } from "./api";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { TechnicianPage } from "./pages/TechnicianPage";
import { ApproverPage } from "./pages/ApproverPage";
import "./App.css";

type View = "landing" | "login" | "signup" | "app";

function App() {
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        if (localStorage.getItem("am-pop-token")) {
          const verified = await verifyToken();
          setUser(verified);
          localStorage.setItem("am-pop-user", JSON.stringify(verified));
          setView("app");
        } else {
          setView(localStorage.getItem("am-pop-welcome") ? "login" : "landing");
        }
      } catch {
        logout();
        setView(localStorage.getItem("am-pop-welcome") ? "login" : "landing");
      }
    }
    void restoreSession();
  }, []);

  function handleLoginSuccess(authenticatedUser: User, token: string) {
    setUser(authenticatedUser);
    localStorage.setItem("am-pop-token", token);
    localStorage.setItem("am-pop-user", JSON.stringify(authenticatedUser));
    localStorage.setItem("am-pop-welcome", "true");
    setView("app");
  }

  function handleLogout() {
    setUser(null);
    logout();
    setView("login");
  }

  return (
    <div className="animate-fade">
      {view === "landing" && (
        <LandingPage onSignIn={() => setView("login")} onGetStarted={() => setView("signup")} />
      )}

      {view === "login" && (
        <LoginPage
          onLogin={handleLoginSuccess}
          onBack={() => setView("landing")}
          onSignup={() => setView("signup")}
        />
      )}

      {view === "signup" && <SignupPage onSignup={handleLoginSuccess} onSignIn={() => setView("login")} />}

      {view === "app" && user && (
        <>
          {user.role === "technician" ? (
            <TechnicianPage user={user} onLogout={handleLogout} />
          ) : (
            <ApproverPage user={user} onLogout={handleLogout} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
