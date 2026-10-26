import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { IconArrowRight } from "./Icons";

export type PublicView = "landing" | "about" | "contact" | "legal" | "pricing" | "login" | "signup";

interface LandingLayoutProps {
  children: ReactNode;
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
  onGetStarted: () => void;
  currentView?: string;
}

export function LandingLayout({
  children,
  onNavigate,
  onSignIn,
  onGetStarted,
  currentView = "landing",
}: LandingLayoutProps) {
  function handleLogoClick() {
    onNavigate("landing");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleNavLink(target: PublicView, hashId?: string) {
    onNavigate(target);
    if (hashId && typeof window !== "undefined") {
      setTimeout(() => {
        document.getElementById(hashId)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="landing-layout-wrapper animate-fade">
      {/* Top Navbar */}
      <nav className="landing-nav" aria-label="Primary navigation">
        <button
          type="button"
          className="landing-nav-logo"
          onClick={handleLogoClick}
          aria-label="Praxis home"
        >
          <Logo />
        </button>

        <div className="landing-nav-links" role="menubar">
          <button
            type="button"
            className={`nav-link ${currentView === "landing" ? "active" : ""}`}
            onClick={() => handleNavLink("landing")}
            role="menuitem"
          >
            Platform
          </button>
          <button
            type="button"
            className={`nav-link ${currentView === "pricing" ? "active" : ""}`}
            onClick={() => handleNavLink("pricing")}
            role="menuitem"
          >
            Pricing
          </button>
          <button
            type="button"
            className={`nav-link ${currentView === "about" ? "active" : ""}`}
            onClick={() => handleNavLink("about")}
            role="menuitem"
          >
            Why Trust Praxis
          </button>
          <button
            type="button"
            className={`nav-link ${currentView === "contact" ? "active" : ""}`}
            onClick={() => handleNavLink("contact")}
            role="menuitem"
          >
            Contact
          </button>
          <button
            type="button"
            className={`nav-link ${currentView === "legal" ? "active" : ""}`}
            onClick={() => handleNavLink("legal")}
            role="menuitem"
          >
            Legal
          </button>
        </div>

        <div className="landing-nav-actions">
          <button type="button" className="nav-signin" onClick={onSignIn}>
            Sign in
          </button>
          <button type="button" className="landing-nav-btn" onClick={onGetStarted}>
            Get Started Free <IconArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="landing-layout-content">{children}</main>

      {/* Enterprise SaaS Footer */}
      <footer className="landing-footer" aria-label="Footer navigation">
        <div className="footer-grid">
          <div className="footer-brand">
            <button
              type="button"
              className="footer-brand-btn"
              onClick={handleLogoClick}
              aria-label="Praxis home"
            >
              <Logo />
            </button>
            <p>Decision intelligence for autonomous and accountable operations.</p>
          </div>

          <div>
            <h3>Product</h3>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("landing", "features")}
            >
              Capabilities
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("landing", "how")}
            >
              Decision Loop
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("landing", "team")}
            >
              Role Hierarchies
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("about")}
            >
              DFA Guardrails
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("pricing")}
            >
              Plans & Pricing
            </button>
          </div>

          <div>
            <h3>Company</h3>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("about")}
            >
              About Praxis
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("contact")}
            >
              Get in Touch
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("about")}
            >
              Trust & Security
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("legal")}
            >
              Compliance Overview
            </button>
          </div>

          <div>
            <h3>Legal & Trust</h3>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("legal")}
            >
              Terms of Service
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("legal")}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("legal")}
            >
              Data Processing (DPA)
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("legal")}
            >
              Service Level Agreement (SLA)
            </button>
          </div>
        </div>

        {/* Exact required Footer bar: Company | About | Contact | Legal */}
        <div className="footer-links-bar" aria-label="Quick links">
          <button
            type="button"
            className="footer-link-text"
            onClick={() => handleNavLink("about")}
          >
            Company
          </button>
          <span className="footer-sep" aria-hidden="true">|</span>
          <button
            type="button"
            className="footer-link-text"
            onClick={() => handleNavLink("about")}
          >
            About
          </button>
          <span className="footer-sep" aria-hidden="true">|</span>
          <button
            type="button"
            className="footer-link-text"
            onClick={() => handleNavLink("contact")}
          >
            Contact
          </button>
          <span className="footer-sep" aria-hidden="true">|</span>
          <button
            type="button"
            className="footer-link-text"
            onClick={() => handleNavLink("legal")}
          >
            Legal
          </button>
        </div>

        {/* Exact required Footer bottom text */}
        <div className="footer-bottom">
          <span>© 2026 Praxis Platform. All rights reserved.</span>
          <span>Built for accountable operations.</span>
        </div>
      </footer>
    </div>
  );
}
