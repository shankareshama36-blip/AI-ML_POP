import { useEffect, useState } from "react";
import { IconCheck, IconX, IconShield, IconArrowRight, IconClipboard } from "../components/Icons";
import { useToast } from "../components/Toast";
import type { PublicView } from "../components/LandingLayout";
import type { User } from "../api";

interface CustomizePageProps {
  user?: User | null;
  onNavigate?: (view: PublicView) => void;
  onGetStarted?: () => void;
  onUpgradeSuccess?: () => void;
}

type PlanId = "starter" | "professional" | "enterprise";

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  amount: number | null;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    period: "",
    amount: 0,
    blurb: "For individuals and small teams exploring Praxis.",
    features: [
      "1 workspace, up to 5 users",
      "DFA validation & Dijkstra optimization",
      "AI recommendations",
      "Community support",
    ],
    cta: "Start for free",
  },
  {
    id: "professional",
    name: "Professional",
    price: "₹4,999",
    period: "/ month",
    amount: 4999,
    blurb: "For growing teams that need approvals and automation.",
    features: [
      "Unlimited users & complaints",
      "Multi-tier approval chains",
      "Voice AI chat & autonomous mode",
      "Audit trail & priority support",
    ],
    cta: "Upgrade to Pro",
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    amount: null,
    blurb: "For plants and organizations with advanced requirements.",
    features: [
      "Custom integrations & SSO",
      "Dedicated SLA & 24/7 support",
      "On-prem / private cloud options",
      "Dedicated success engineer",
    ],
    cta: "Upgrade to Enterprise",
  },
];

function buildUpiQrUrl(amount: number | null): string {
  const params = new URLSearchParams({ pa: "praxis@upi", pn: "Praxis", cu: "INR" });
  if (amount) params.set("am", String(amount));
  const upiLink = `upi://pay?${params.toString()}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(upiLink)}`;
}

export function CustomizePage({ user, onNavigate, onGetStarted, onUpgradeSuccess }: CustomizePageProps) {
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  function saveTier(tier: PlanId) {
    try {
      localStorage.setItem("praxis-workspace-tier", tier);
    } catch {
      // Storage unavailable
    }
  }

  function handleSelectPlan(plan: Plan) {
    if (plan.id === "starter") {
      saveTier("starter");
      if (user) {
        showToast("Starter plan active. Free forever.", "success");
        if (onUpgradeSuccess) onUpgradeSuccess();
        else onNavigate?.("app" as PublicView);
      } else {
        showToast("Starter plan selected. Create your account to start.", "success");
        if (onGetStarted) onGetStarted();
        else onNavigate?.("signup");
      }
      return;
    }
    // For paid plans (Pro or Enterprise), open the UPI payment modal
    setSelectedPlan(plan);
  }

  function handleContinueAfterPayment() {
    if (!selectedPlan) return;
    // TODO: In production, verify payment on the backend via payment gateway/bank webhook
    // (e.g. Razorpay/Cashfree/Stripe/UPI bank settlement notification) before updating
    // subscription status in the database. Currently activates client-side tier for instant access.
    saveTier(selectedPlan.id);
    showToast(`${selectedPlan.name} plan activated! Thank you for subscribing.`, "success");
    setSelectedPlan(null);

    if (user) {
      if (onUpgradeSuccess) onUpgradeSuccess();
      else onNavigate?.("app" as PublicView);
    } else {
      if (onGetStarted) onGetStarted();
      else onNavigate?.("signup");
    }
  }

  function copyUpiId() {
    navigator.clipboard?.writeText("praxis@upi").then(() => {
      setCopiedUpi(true);
      showToast("UPI ID copied to clipboard (praxis@upi)", "success");
      setTimeout(() => setCopiedUpi(false), 3000);
    }).catch(() => {
      showToast("UPI ID: praxis@upi", "info");
    });
  }

  // Close the dialog with Escape and lock background scroll while open.
  useEffect(() => {
    if (!selectedPlan) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedPlan(null);
    }
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedPlan]);

  return (
    <div className="plan-flow-page animate-fade">
      <header className="plan-flow-header">
        <ol className="plan-steps" aria-label="Checkout progress">
          <li className={selectedPlan ? "done" : "active"}><span>1</span> Choose plan</li>
          <li className={selectedPlan ? "active" : ""}><span>2</span> Pay via UPI</li>
          <li><span>3</span> Activate</li>
        </ol>
        <h1 className="plan-flow-title">Pick the plan that fits</h1>
        <p className="plan-flow-sub">Start free, upgrade when your team is ready. No hidden fees.</p>
      </header>

      <div className="plan-grid">
        {PLANS.map((plan) => (
          <article key={plan.id} className={`plan-card${plan.featured ? " featured" : ""}`}>
            {plan.featured && <span className="plan-ribbon">Most popular</span>}
            <h2 className="plan-name">{plan.name}</h2>
            <p className="plan-blurb">{plan.blurb}</p>
            <div className="plan-price">
              <strong>{plan.price}</strong>
              {plan.period && <span>{plan.period}</span>}
            </div>
            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}><IconCheck size={15} /> {f}</li>
              ))}
            </ul>
            <button
              type="button"
              className={plan.featured ? "btn-primary plan-cta" : "btn-ghost plan-cta"}
              onClick={() => handleSelectPlan(plan)}
            >
              {plan.cta} <IconArrowRight size={15} />
            </button>
          </article>
        ))}
      </div>

      {onNavigate && (
        <p className="plan-compare">
          Want the full comparison?{" "}
          <button type="button" className="inline-link" onClick={() => onNavigate("pricing")}>
            Compare all features
          </button>
        </p>
      )}

      {/* Step 2: Payment dialog with UPI QR Code */}
      {selectedPlan && (
        <div className="plan-modal-backdrop animate-fade" onClick={() => setSelectedPlan(null)}>
          <div
            className="plan-modal animate-scale"
            role="dialog"
            aria-modal="true"
            aria-label={`Pay for ${selectedPlan.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="plan-modal-close"
              onClick={() => setSelectedPlan(null)}
              aria-label="Close payment dialog"
            >
              <IconX size={20} />
            </button>

            <div className="plan-modal-icon"><IconShield size={26} /></div>
            <h3 className="plan-modal-title">{selectedPlan.name} Plan</h3>
            <p className="plan-modal-sub">Scan the QR code with Google Pay, PhonePe, Paytm, or any UPI app.</p>

            <div className="plan-modal-price">
              <span>Total</span>
              <strong>{selectedPlan.price}</strong>
              {selectedPlan.period && <span>{selectedPlan.period}</span>}
            </div>

            <div className="plan-qr" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img
                src={buildUpiQrUrl(selectedPlan.amount)}
                alt={`UPI payment QR code for ${selectedPlan.name} plan`}
                width={220}
                height={220}
                style={{ borderRadius: "8px", border: "1px solid var(--border-subtle)" }}
              />
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--bg-elevated)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span>UPI ID: <strong>praxis@upi</strong></span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="btn-link"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                  aria-label="Copy UPI ID"
                >
                  <IconClipboard size={14} /> {copiedUpi ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {selectedPlan.amount === null && (
              <p className="plan-modal-note" style={{ marginTop: "12px" }}>
                Enterprise pricing is tailored to your facility. Enter the agreed amount in your UPI app, or{" "}
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => {
                    setSelectedPlan(null);
                    onNavigate?.("contact");
                  }}
                >
                  talk to sales
                </button>
                .
              </p>
            )}

            <button
              type="button"
              className="btn-primary plan-modal-confirm"
              onClick={handleContinueAfterPayment}
              style={{ marginTop: "16px", width: "100%", justifyContent: "center" }}
            >
              <IconCheck size={18} /> I have paid, activate plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
