import { useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { IconArrowRight } from "./Icons";

export type PublicView = "landing" | "about" | "contact" | "legal" | "pricing" | "customize" | "login" | "signup";

/** localStorage key + window event used to deep-link into a LegalPage tab. */
export const LEGAL_TAB_KEY = "praxis-legal-tab";
export const LEGAL_TAB_EVENT = "praxis-legal-tab";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogoClick() {
    setMobileMenuOpen(false);
    onNavigate("landing");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleNavLink(target: PublicView, hashId?: string) {
    setMobileMenuOpen(false);
    onNavigate(target);
    if (hashId && typeof window !== "undefined") {
      setTimeout(() => {
        document.getElementById(hashId)?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  /** Open the legal page directly on the requested document tab. */
  function handleLegalLink(tab: "terms" | "privacy") {
    try {
      localStorage.setItem(LEGAL_TAB_KEY, tab);
    } catch {
      // Storage unavailable
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(LEGAL_TAB_EVENT, { detail: tab }));
    }
    handleNavLink("legal");
  }

  return (
    <div className="landing-layout-wrapper animate-fade">
      {/* Top Navbar: Logo left, Nav links center, Sign In + Get Started right */}
      <nav className="landing-nav" aria-label="Primary navigation">
        <button
          type="button"
          className="landing-nav-logo"
          onClick={handleLogoClick}
          aria-label="Praxis home"
        >
          <Logo />
        </button>

        <div className={`landing-nav-links ${mobileMenuOpen ? "open" : ""}`}>
          <button
            type="button"
            className={`nav-link-btn ${currentView === "landing" ? "active" : ""}`}
            onClick={() => handleNavLink("landing", "features")}
          >
            Features
          </button>
          <button
            type="button"
            className={`nav-link-btn ${currentView === "pricing" ? "active" : ""}`}
            onClick={() => handleNavLink("pricing")}
          >
            Pricing
          </button>
          <button
            type="button"
            className={`nav-link-btn ${currentView === "customize" ? "active" : ""}`}
            onClick={() => handleNavLink("customize")}
          >
            Customize
          </button>
          <button
            type="button"
            className={`nav-link-btn ${currentView === "about" ? "active" : ""}`}
            onClick={() => handleNavLink("about")}
          >
            About
          </button>
          <button
            type="button"
            className={`nav-link-btn ${currentView === "contact" ? "active" : ""}`}
            onClick={() => handleNavLink("contact")}
          >
            Contact
          </button>
        </div>

        {/* Actions: Sign In (ghost) & Get Started (primary) */}
        <div className="landing-nav-actions">
          <button type="button" className="btn-ghost nav-signin" onClick={onSignIn}>
            Sign In
          </button>
          <button type="button" className="btn-primary landing-nav-btn" onClick={onGetStarted}>
            Get Started Free <IconArrowRight size={14} />
          </button>
          <button
            type="button"
            className="nav-hamburger"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="landing-layout-content">{children}</main>

      {/* Footer */}
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
              Features
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("pricing")}
            >
              Pricing
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("customize")}
            >
              Customize Plan
            </button>
          </div>

          <div>
            <h3>Company</h3>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("about")}
            >
              About
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleNavLink("contact")}
            >
              Contact
            </button>
          </div>

          <div>
            <h3>Legal</h3>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleLegalLink("privacy")}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => handleLegalLink("terms")}
            >
              Terms of Service
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Praxis Platform. All rights reserved.</span>
          <span>Built for accountable operations.</span>
        </div>
      </footer>
    </div>
  );
}
