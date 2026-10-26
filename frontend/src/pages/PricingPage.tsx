import { useState } from "react";
import {
  IconCheck,
  IconX,
  IconArrowRight,
  IconShield,
  IconCpu,
  IconLock,
} from "../components/Icons";
import type { PublicView } from "../components/LandingLayout";

interface PricingPageProps {
  onNavigate: (view: PublicView) => void;
  onGetStarted: () => void;
}

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  badge?: string;
  popular?: boolean;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  period: string;
  description: string;
  ctaText: string;
  ctaAction: "signup" | "contact";
  features: PlanFeature[];
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For small facilities & pilot machine cells",
    monthlyPrice: "₹0",
    annualPrice: "₹0",
    period: "forever free",
    description:
      "Deploy deterministic AI validation and shortest-path optimization on a single line with zero financial risk.",
    ctaText: "Choose Starter (Free)",
    ctaAction: "signup",
    features: [
      { text: "Up to 5 team members", included: true },
      { text: "1 active machine production line", included: true },
      { text: "DFA formal state machine validation", included: true },
      { text: "Dijkstra optimal action path generation", included: true },
      { text: "Single-tier supervisor approvals", included: true },
      { text: "7-day audit trail history", included: true },
      { text: "Community & standard email support", included: true },
      { text: "Custom financial thresholds", included: false },
      { text: "Multi-tenant invite code management", included: false },
      { text: "Production & Plant Manager multi-tier chain", included: false },
      { text: "Dedicated tenant isolation & SLA", included: false },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    badge: "Most Popular",
    popular: true,
    tagline: "For high-throughput manufacturing plants",
    monthlyPrice: "₹4,999",
    annualPrice: "₹3,999",
    period: "per workspace / month",
    description:
      "Full multi-tenant governance with customizable approval thresholds and automated multi-tier escalation.",
    ctaText: "Choose Professional",
    ctaAction: "signup",
    features: [
      { text: "Up to 25 team members", included: true, highlight: true },
      { text: "Unlimited machine lines & complaints", included: true },
      { text: "DFA formal state machine validation", included: true },
      { text: "Dijkstra optimal action path generation", included: true },
      { text: "Multi-tier approval workflows (Maint → Prod → Plant)", included: true, highlight: true },
      { text: "Custom Tier 1 & Tier 2 thresholds (Settings)", included: true, highlight: true },
      { text: "Workspace invite codes & member management", included: true },
      { text: "1-year cryptographic audit retention", included: true },
      { text: "ML cost & downtime variance prediction", included: true },
      { text: "Priority 24/7 technical support", included: true },
      { text: "99.9% uptime SLA commitment", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "Custom Scale",
    tagline: "For multi-site industrial groups & regulated plants",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    period: "tailored annual contract",
    description:
      "Dedicated infrastructure, customized DFA state machines, direct ERP / SCADA links, and dedicated solutions engineering.",
    ctaText: "Choose Enterprise (Contact Sales)",
    ctaAction: "contact",
    features: [
      { text: "Unlimited team members across sites", included: true, highlight: true },
      { text: "Multi-plant workspace federation", included: true },
      { text: "Dedicated PostgreSQL database or VPC", included: true, highlight: true },
      { text: "Custom DFA rules & plant ontology schemas", included: true, highlight: true },
      { text: "ERP, MES, SAP & SCADA system connectors", included: true },
      { text: "Enterprise SSO (SAML 2.0 / Okta / Azure AD)", included: true },
      { text: "Unlimited cryptographic audit trail retention", included: true },
      { text: "Custom financial thresholds per division", included: true },
      { text: "Dedicated Solutions Architect & SLA manager", included: true },
      { text: "24/7 phone & Slack escalation with 1-hr SLA", included: true },
      { text: "99.99% financial uptime SLA", included: true },
    ],
  },
];

interface ComparisonCategory {
  title: string;
  items: {
    name: string;
    starter: string | boolean;
    professional: string | boolean;
    enterprise: string | boolean;
  }[];
}

const COMPARISON_TABLE: ComparisonCategory[] = [
  {
    title: "Core Verification & Intelligence",
    items: [
      {
        name: "Deterministic Finite Automaton (DFA) Guardrails",
        starter: true,
        professional: true,
        enterprise: true,
      },
      {
        name: "Dijkstra Optimal Path Calculation",
        starter: true,
        professional: true,
        enterprise: true,
      },
      {
        name: "ML Expected Cost & Downtime Estimation",
        starter: "Basic",
        professional: "Advanced (Calibrated)",
        enterprise: "Custom Trained Models",
      },
      {
        name: "Custom State Machine Envelopes",
        starter: false,
        professional: false,
        enterprise: true,
      },
    ],
  },
  {
    title: "Multi-Tenancy & Authorization",
    items: [
      {
        name: "Tenant Data Isolation",
        starter: "Logical (Strict)",
        professional: "Logical (Strict)",
        enterprise: "Dedicated DB / VPC",
      },
      {
        name: "Included Seats",
        starter: "5 users",
        professional: "25 users",
        enterprise: "Unlimited",
      },
      {
        name: "Multi-Tier Approval Chains (Tier 1 / Tier 2)",
        starter: false,
        professional: true,
        enterprise: true,
      },
      {
        name: "Custom Financial Threshold Controls",
        starter: false,
        professional: true,
        enterprise: true,
      },
      {
        name: "Workspace Member Invite Codes",
        starter: false,
        professional: true,
        enterprise: true,
      },
      {
        name: "Single Sign-On (SAML / Okta)",
        starter: false,
        professional: false,
        enterprise: true,
      },
    ],
  },
  {
    title: "Governance & Support",
    items: [
      {
        name: "Audit Trail Retention",
        starter: "7 days",
        professional: "1 year",
        enterprise: "Unlimited",
      },
      {
        name: "Support Channel",
        starter: "Email",
        professional: "Priority 24/7 Email & Chat",
        enterprise: "Dedicated SLA + Phone",
      },
      {
        name: "Uptime SLA Guarantee",
        starter: "Best Effort",
        professional: "99.9%",
        enterprise: "99.99%",
      },
      {
        name: "Custom ERP/MES Integrations",
        starter: false,
        professional: "REST API only",
        enterprise: "Custom Connectors",
      },
    ],
  },
];

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Can I adjust my financial approval thresholds after signing up?",
    answer:
      "Yes. On Professional and Enterprise plans, Plant Managers and Admins can navigate to Workspace Settings at any time to set custom Tier 1 (e.g., ₹10,000) and Tier 2 (e.g., ₹50,000) approval boundaries.",
  },
  {
    question: "How does strict multi-tenant data isolation work?",
    answer:
      "Every single query in the Praxis backend enforces an indexed tenant_id verified cryptographically against your JWT session. Technicians and supervisors from Company A can never view or mutate data belonging to Company B.",
  },
  {
    question: "How do multi-tier approvals handle large emergency expenditures?",
    answer:
      "When AI decision evaluation calculates an expected cost exceeding Tier 1, the complaint is routed to the Production Supervisor. If the cost exceeds Tier 2, the complaint is further escalated to the Plant Manager for executive sign-off.",
  },
  {
    question: "Can we start on the free Starter tier and upgrade later?",
    answer:
      "Absolutely. You can start on the Starter tier with up to 5 technicians, run DFA evaluations, and upgrade to Professional as soon as your team needs customizable thresholds or multi-tier approvals.",
  },
  {
    question: "Do you offer air-gapped on-premise deployments?",
    answer:
      "Yes. Our Enterprise tier offers customer-hosted Docker or Kubernetes deployments for defense, petrochemical, and secure manufacturing facilities requiring complete data sovereignty.",
  },
];

export function PricingPage({ onNavigate, onGetStarted }: PricingPageProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleAction(action: "signup" | "contact") {
    if (action === "signup") {
      onGetStarted();
    } else {
      onNavigate("contact");
    }
  }

  function toggleFaq(index: number) {
    setOpenFaq((prev) => (prev === index ? null : index));
  }

  return (
    <div className="pricing-page animate-fade">
      {/* Hero Header */}
      <header className="pricing-hero">
        <div className="hero-badge">Transparent B2B SaaS Plans</div>
        <h1 className="pricing-hero-title">
          Invest in Predictable, Auditable Industrial Operations
        </h1>
        <p className="pricing-hero-subtitle">
          Choose the plan that fits your manufacturing plant. Every tier includes our core DFA
          state machine verification and Dijkstra route optimization.
        </p>

        {/* Billing Toggle */}
        <div className="pricing-toggle-wrap" role="group" aria-label="Billing cycle selector">
          <button
            type="button"
            className={`pricing-toggle-btn ${billingCycle === "monthly" ? "active" : ""}`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            className={`pricing-toggle-btn ${billingCycle === "annual" ? "active" : ""}`}
            onClick={() => setBillingCycle("annual")}
          >
            Annual Billing
            <span className="pricing-discount-pill">Save 20%</span>
          </button>
        </div>
      </header>

      {/* 3 Pricing Cards Grid */}
      <section className="pricing-cards-section" aria-label="Subscription plans">
        <div className="pricing-grid">
          {PLANS.map((plan) => {
            const price =
              billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`pricing-card ${plan.popular ? "pricing-card-popular" : ""}`}
              >
                {plan.badge && (
                  <div className="pricing-card-badge">
                    {plan.badge}
                  </div>
                )}

                <div className="pricing-card-header">
                  <h2 className="pricing-plan-name">{plan.name}</h2>
                  <p className="pricing-plan-tagline">{plan.tagline}</p>
                </div>

                <div className="pricing-price-box">
                  <div className="pricing-price-row">
                    <span className="pricing-price-value">{price}</span>
                    {price !== "Custom" && (
                      <span className="pricing-price-currency">/mo</span>
                    )}
                  </div>
                  <span className="pricing-price-period">
                    {billingCycle === "annual" && price !== "Custom"
                      ? "billed annually"
                      : plan.period}
                  </span>
                </div>

                <p className="pricing-plan-description">{plan.description}</p>

                <div className="pricing-cta-wrap">
                  <button
                    type="button"
                    className={`btn-primary pricing-cta-btn ${
                      plan.popular ? "pricing-cta-popular" : ""
                    }`}
                    onClick={() => handleAction(plan.ctaAction)}
                  >
                    {plan.ctaText}
                    <IconArrowRight size={16} />
                  </button>
                  <p className="pricing-guarantee-note">
                    {plan.id === "starter"
                      ? "No credit card required"
                      : plan.id === "professional"
                      ? "14-day risk-free trial • Cancel anytime"
                      : "Bespoke SLA & Custom Billing"}
                  </p>
                </div>

                <div className="pricing-features-wrap">
                  <p className="pricing-features-heading">What's included:</p>
                  <ul className="pricing-features-list">
                    {plan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className={`pricing-feature-item ${
                          !feat.included ? "disabled" : ""
                        } ${feat.highlight ? "highlight" : ""}`}
                      >
                        <span className="pricing-feature-icon">
                          {feat.included ? (
                            <IconCheck size={14} className="text-success" />
                          ) : (
                            <IconX size={14} className="text-muted" />
                          )}
                        </span>
                        <span className="pricing-feature-text">{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="pricing-comparison-section" aria-labelledby="comparison-title">
        <div className="section-head">
          <p className="eyebrow">Detailed Breakdown</p>
          <h2 id="comparison-title" className="section-title">
            Compare Features Across Plans
          </h2>
          <p className="section-sub">
            Review detailed capabilities across verification, authorization tiers, and operational SLAs.
          </p>
        </div>

        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "40%" }}>Capability</th>
                <th scope="col" style={{ width: "20%" }}>Starter</th>
                <th scope="col" style={{ width: "20%", background: "var(--brand-soft)" }}>
                  Professional
                </th>
                <th scope="col" style={{ width: "20%" }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_TABLE.map((category, catIdx) => (
                <tr key={`cat-${catIdx}`} className="comparison-cat-row">
                  <td colSpan={4} className="comparison-cat-cell">
                    {category.title}
                  </td>
                </tr>
              )).reduce<React.ReactNode[]>((acc, catRow, idx) => {
                const category = COMPARISON_TABLE[idx];
                acc.push(catRow);
                category.items.forEach((item, itemIdx) => {
                  acc.push(
                    <tr key={`item-${idx}-${itemIdx}`}>
                      <td className="comparison-item-name">{item.name}</td>
                      <td className="comparison-cell">
                        {typeof item.starter === "boolean" ? (
                          item.starter ? (
                            <IconCheck size={16} className="text-success" />
                          ) : (
                            <IconX size={16} className="text-muted" />
                          )
                        ) : (
                          <span>{item.starter}</span>
                        )}
                      </td>
                      <td className="comparison-cell" style={{ background: "rgba(37, 99, 235, 0.04)" }}>
                        {typeof item.professional === "boolean" ? (
                          item.professional ? (
                            <IconCheck size={16} className="text-success" />
                          ) : (
                            <IconX size={16} className="text-muted" />
                          )
                        ) : (
                          <span style={{ fontWeight: 600, color: "var(--brand)" }}>
                            {item.professional}
                          </span>
                        )}
                      </td>
                      <td className="comparison-cell">
                        {typeof item.enterprise === "boolean" ? (
                          item.enterprise ? (
                            <IconCheck size={16} className="text-success" />
                          ) : (
                            <IconX size={16} className="text-muted" />
                          )
                        ) : (
                          <span style={{ fontWeight: 600 }}>{item.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  );
                });
                return acc;
              }, [])}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trust & Guarantee Row */}
      <section className="pricing-trust-section" aria-label="Guarantees">
        <div className="pricing-trust-grid">
          <div className="pricing-trust-card">
            <div className="trust-icon-box">
              <IconShield size={24} />
            </div>
            <h3>Deterministic Verification</h3>
            <p>
              Every plan includes our formal automaton validation. We reject physically impossible
              requests before evaluation to prevent costly incorrect repairs.
            </p>
          </div>
          <div className="pricing-trust-card">
            <div className="trust-icon-box">
              <IconLock size={24} />
            </div>
            <h3>Tenant Isolation</h3>
            <p>
              Your plant data, maintenance records, and threshold policies are strictly isolated
              by encrypted workspace identifiers across all operations.
            </p>
          </div>
          <div className="pricing-trust-card">
            <div className="trust-icon-box">
              <IconCpu size={24} />
            </div>
            <h3>Predictive Cost Routing</h3>
            <p>
              Dynamic multi-tier approvals automatically route high-budget repairs to the right
              supervisor and manager before money is spent.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="pricing-faq-section" aria-labelledby="faq-title">
        <div className="section-head">
          <p className="eyebrow">Clear Answers</p>
          <h2 id="faq-title" className="section-title">
            Frequently Asked Questions
          </h2>
          <p className="section-sub">
            Everything you need to know about plans, billing, and enterprise onboarding.
          </p>
        </div>

        <div className="faq-list">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`faq-item ${isOpen ? "open" : ""}`}
                onClick={() => toggleFaq(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleFaq(idx);
                  }
                }}
              >
                <div className="faq-question-row">
                  <h3 className="faq-question">{faq.question}</h3>
                  <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
                </div>
                {isOpen && <p className="faq-answer animate-fade">{faq.answer}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Action Callout */}
      <section className="cta-final" aria-labelledby="cta-pricing-title">
        <h2 id="cta-pricing-title">Ready to bring accountable intelligence to your plant?</h2>
        <p>
          Sign up your company in less than 2 minutes. No hardware installations, zero lock-in,
          and transparent pricing.
        </p>
        <div className="about-cta-actions">
          <button type="button" className="btn-primary cta-button" onClick={onGetStarted}>
            Create Company Workspace <IconArrowRight size={18} />
          </button>
          <button
            type="button"
            className="btn-ghost cta-button-secondary"
            onClick={() => onNavigate("contact")}
          >
            Talk to an Enterprise Specialist
          </button>
        </div>
      </section>
    </div>
  );
}
