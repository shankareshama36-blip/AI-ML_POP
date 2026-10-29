import { useEffect } from "react";
import { IconArrowRight, IconCheckCircle, IconSparkles, IconX, IconZap } from "./Icons";
import { type PublicView } from "./LandingLayout";

interface UpgradeSidePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: PublicView) => void;
  onSignUp?: () => void;
  onPricing?: () => void;
}

export function UpgradeSidePopup({
  isOpen,
  onClose,
  onNavigate,
  onSignUp,
  onPricing,
}: UpgradeSidePopupProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignUpClick = () => {
    onClose();
    if (onSignUp) {
      onSignUp();
    } else if (onNavigate) {
      onNavigate("signup" as PublicView);
    }
  };

  const handlePricingClick = () => {
    onClose();
    if (onPricing) {
      onPricing();
    } else if (onNavigate) {
      onNavigate("pricing" as PublicView);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-side-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(3, 7, 18, 0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "fadeIn 0.25s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="upgrade-slide-pane animate-slide-left"
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100%",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)",
          borderLeft: "1px solid rgba(59, 130, 246, 0.35)",
          boxShadow: "-15px 0 50px rgba(0, 0, 0, 0.7), -1px 0 20px rgba(59, 130, 246, 0.15)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflowY: "auto",
          padding: "36px 30px",
        }}
      >
        {/* Glow ambient circle */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "240px",
            height: "240px",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        {/* Top Header & Close button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />
            Demo Limit Reached
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close upgrade modal"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Title & Body */}
        <div style={{ marginBottom: "28px", position: "relative", zIndex: 1 }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "18px",
              boxShadow: "0 8px 16px -4px rgba(59, 130, 246, 0.2)",
            }}
          >
            <IconSparkles size={26} color="#60a5fa" />
          </div>

          <h2
            id="upgrade-side-title"
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#f8fafc",
              lineHeight: 1.25,
              margin: "0 0 12px",
              letterSpacing: "-0.02em",
            }}
          >
            Out of Demo Credits
          </h2>

          <p style={{ fontSize: "15px", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
            You have used all <strong>10 free messages</strong> in this sandbox session. Unlock unmetered operational reasoning, formal DFA state verification, and private workspace ledgers with a full Praxis account.
          </p>
        </div>

        {/* Value Proposition Highlights */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "32px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>
            Included with Full Access
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <IconCheckCircle size={16} color="#10b981" />
              <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                <strong>Unlimited AI Invariant Checks</strong> with zero token throttling
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <IconCheckCircle size={16} color="#10b981" />
              <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                <strong>Multi-Objective Pareto Routing</strong> for cost & downtime trade-offs
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <IconCheckCircle size={16} color="#10b981" />
              <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                <strong>Cryptographic SHA-256 Audit Trail</strong> with tamper-proof history
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <IconZap size={16} color="#f59e0b" />
              <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                <strong>30-Day Free Trial</strong> with zero credit card commitment
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "auto", position: "relative", zIndex: 1 }}>
          <button
            type="button"
            onClick={handleSignUpClick}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "14px 20px",
              fontSize: "15px",
              fontWeight: 700,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)",
            }}
          >
            Sign Up for 30-Day Free Trial
            <IconArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={handlePricingClick}
            style={{
              width: "100%",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#e2e8f0",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Upgrade to Pro (₹499/mo)
          </button>

          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Instant setup in 60s • No credit card needed for trial
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
