import { useState, type FormEvent } from "react";
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconCheck,
  IconSpinner,
  IconShield,
  IconClock,
} from "../components/Icons";
import { useToast } from "../components/Toast";
import type { PublicView } from "../components/LandingLayout";

interface ContactPageProps {
  onNavigate: (view: PublicView) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Sales");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    setSubmitting(true);
    // Simulate brief network submission
    setTimeout(() => {
      setSubmitting(false);
      showToast("Message sent successfully. We will reply within 24 hours.", "success");
      setName("");
      setEmail("");
      setMessage("");
    }, 400);
  }

  return (
    <div className="contact-page animate-fade">
      {/* Header */}
      <header className="contact-hero">
        <div className="hero-badge">Direct Line to Praxis</div>
        <h1 className="contact-hero-title">Get in touch with our team.</h1>
        <p className="contact-hero-subtitle">
          Have questions about deployment, custom machine integrations, or enterprise SLAs? Our
          operational intelligence engineers are here to help.
        </p>
      </header>

      {/* Main Grid: Direct Info Cards on left, Form on right */}
      <div className="contact-container">
        <div className="contact-grid">
          {/* Left Column: Direct Info Cards */}
          <div className="contact-info-col">
            <h2 className="contact-info-heading">Direct Channels</h2>
            <p className="contact-info-sub">
              Reach our regional engineering hubs and customer success teams directly.
            </p>

            <div className="contact-cards-stack">
              <div className="contact-card">
                <div className="contact-card-icon">
                  <IconMail size={20} />
                </div>
                <div className="contact-card-content">
                  <span className="contact-card-label">Customer Support</span>
                  <a href="mailto:support@praxis-platform.com" className="contact-card-value">
                    support@praxis-platform.com
                  </a>
                  <p className="contact-card-hint">Technical help, bug reports, and API assistance.</p>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon">
                  <IconShield size={20} />
                </div>
                <div className="contact-card-content">
                  <span className="contact-card-label">Enterprise Sales</span>
                  <a href="mailto:sales@praxis-platform.com" className="contact-card-value">
                    sales@praxis-platform.com
                  </a>
                  <p className="contact-card-hint">Custom factory deployments, SLAs, and volume pricing.</p>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon">
                  <IconPhone size={20} />
                </div>
                <div className="contact-card-content">
                  <span className="contact-card-label">Phone Support</span>
                  <a href="tel:+18005550199" className="contact-card-value">
                    +1 (800) 555-0199
                  </a>
                  <p className="contact-card-hint">Mon-Fri 8am-6pm PST · 24/7 for Tier-1 Enterprise.</p>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon">
                  <IconMapPin size={20} />
                </div>
                <div className="contact-card-content">
                  <span className="contact-card-label">Headquarters</span>
                  <address className="contact-card-value not-italic">
                    100 Innovation Way, Silicon Valley, CA 94025
                  </address>
                  <p className="contact-card-hint">United States · Global R&D Center.</p>
                </div>
              </div>
            </div>

            {/* Quick Guarantees */}
            <div className="contact-guarantee-box">
              <div className="guarantee-item">
                <IconClock size={16} />
                <span>Standard response time under 24 hours</span>
              </div>
              <div className="guarantee-item">
                <IconCheck size={16} />
                <span>Enterprise SLA with 15-minute emergency escalations</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Contact Form */}
          <div className="contact-form-col">
            <div className="card contact-form-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title" style={{ fontSize: "18px" }}>
                    Send an Inquiry
                  </h3>
                  <p className="complaint-meta" style={{ marginTop: "4px" }}>
                    Fill out the form below and an engineer will connect with you.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-field">
                  <label className="form-label" htmlFor="contact-name">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Alex Henderson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="contact-email">
                    Work Email <span className="text-danger">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    className="form-input"
                    placeholder="alex@acmemanufacturing.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field full">
                  <label className="form-label" htmlFor="contact-dept">
                    Department / Inquiry Type
                  </label>
                  <select
                    id="contact-dept"
                    className="form-select"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Sales">Enterprise Sales & Licensing</option>
                    <option value="Support">Technical Support & Integrations</option>
                    <option value="Security">Security & Compliance Review</option>
                    <option value="Partnership">Industrial Partnership / OEM</option>
                  </select>
                </div>

                <div className="form-field full">
                  <label className="form-label" htmlFor="contact-msg">
                    Message <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="contact-msg"
                    className="form-textarea"
                    rows={5}
                    placeholder="Tell us about your plant operations, telemetry sources, or specific requirements..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field full">
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center", padding: "12px 20px" }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <IconSpinner size={16} /> Sending Message…
                      </>
                    ) : (
                      <>Send Message</>
                    )}
                  </button>
                </div>

                <p className="contact-disclaimer">
                  By submitting, you agree to our{" "}
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => onNavigate("legal")}
                  >
                    Privacy Policy
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => onNavigate("legal")}
                  >
                    Terms of Service
                  </button>
                  .
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
