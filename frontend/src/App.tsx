import { useState, useEffect } from "react";
import { type User } from "./api";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { TechnicianPage } from "./pages/TechnicianPage";
import { ApproverPage } from "./pages/ApproverPage";
import "./App.css";

const STORAGE_KEY = "am-pop-user";

type View = "landing" | "login" | "app";

function App() {
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as User;
        setUser(parsed);
        setView("app");
      } else {
        setView("landing");
      }
    } catch {
      setView("landing");
    }
  }, []);

  function handleLoginSuccess(authenticatedUser: User) {
    setUser(authenticatedUser);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
    setView("app");
  }

  function handleLogout() {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
    setView("landing");
  }

  return (
    <div className="animate-fade">
      {view === "landing" && (
        <LandingPage onSignIn={() => setView("login")} />
      )}

      {view === "login" && (
        <LoginPage
          onLogin={handleLoginSuccess}
          onBack={() => setView("landing")}
        />
      )}

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