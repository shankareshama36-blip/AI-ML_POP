import { useState, useEffect } from "react";
import { type User } from "./api";
import { LoginPage } from "./pages/LoginPage";
import { TechnicianPage } from "./pages/TechnicianPage";
import { ApproverPage } from "./pages/ApproverPage";
import "./App.css";

const STORAGE_KEY = "am-pop-user";

function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  function handleLogout() {
    setUser(null);
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  if (user.role === "technician") {
    return <TechnicianPage user={user} onLogout={handleLogout} />;
  }

  return <ApproverPage user={user} onLogout={handleLogout} />;
}

export default App;