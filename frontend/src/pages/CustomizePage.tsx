import { useEffect, useState } from "react";
import { IconCheck, IconX, IconShield, IconArrowRight } from "../components/Icons";
import { useToast } from "../components/Toast";
import type { PublicView } from "../components/LandingLayout";

interface CustomizePageProps {
  onNavigate?: (view: PublicView) => void;
  onGetStarted?: () => void;
}

type PlanId = "starter" | "professional" | "enterprise";

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  /** Monthly amount in INR used for the UPI QR. `null` = custom quote. */
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
    features: ["1 workspace, up to 5 users", "DFA validation & Dijkstra optimization", "AI recommendations", "Community support"],
    cta: "Start for free",
  },
  {
    id: "professional",
    name: "Professional",
    price: "₹4,999",
    period: "/ month",
    amount: 4999,
    blurb: "For growing teams that need approvals and automation.",
    features: ["Unlimited users", "Multi-tier approval chains", "Voice AI chat & autonomous mode", "Audit trail & priority support"],
    cta: "Choose Professional",
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    amount: null,
    blurb: "For plants and organisations with advanced requirements.",
    features: ["Custom integrations & SSO", "Dedicated SLA & 24/7 support", "On-prem / private cloud options", "Dedicated success engineer"],
    cta: "Choose Enterprise",
  },
];

function buildUpiQrUrl(amount: number | null): string {
  const params = new URLSearchParams({ pa: "praxis@upi", pn: "Praxis", cu: "INR" });
  if (amount) params.set("am", String(amount));
  const upiLink = `upi://pay?${params.toString()}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(upiLink)}`;
}

/**
 * Strict 3-step flow:
 *   1. Pick a plan
 *   2. Starter -> signup immediately; paid plans -> payment dialog
 *   3. Payment dialog shows the UPI QR, price and a "continue to signup" button
 * The QR code is never rendered until a paid plan is chosen.
 */
export function CustomizePage({ onNavigate, onGetStarted }: CustomizePageProps) {
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  function goToSignup() {
    if (onGetStarted) onGetStarted();
    else onNavigate?.("signup");
  }

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
      goToSignup();
      return;
    }
    setSelectedPlan(plan);
  }

  function handleContinueToSignup() {
    if (!selectedPlan) return;
    saveTier(selectedPlan.id);
    showToast(`${selectedPlan.name} plan selected. Create your account to continue.`, "success");
    setSelectedPlan(null);
    goToSignup();
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
          <li className={selectedPlan ? "active" : ""}><span>2</span> Pay</li>
          <li><span>3</span> Sign up</li>
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

      {/* Step 3: payment dialog (only mounted after a paid plan is chosen) */}
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
            <h3 className="plan-modal-title">{selectedPlan.name} plan</h3>
            <p className="plan-modal-sub">Scan the QR code with any UPI app to pay.</p>

            <div className="plan-modal-price">
              <span>Total</span>
              <strong>{selectedPlan.price}</strong>
              {selectedPlan.period && <span>{selectedPlan.period}</span>}
            </div>

            <div className="plan-qr">
              <img
                src={buildUpiQrUrl(selectedPlan.amount)}
                alt={`UPI payment QR code for the ${selectedPlan.name} plan`}
                width={240}
                height={240}
              />
            </div>

            {selectedPlan.amount === null && (
              <p className="plan-modal-note">
                Enterprise pricing is quoted per deployment. Enter the agreed amount in your UPI app, or{" "}
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

            <button type="button" className="btn-primary plan-modal-confirm" onClick={handleContinueToSignup}>
              <IconCheck size={18} /> I have paid, continue to Signup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
