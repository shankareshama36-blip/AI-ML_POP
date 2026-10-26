import { useState } from "react";
import {
  IconFileText,
  IconShield,
  IconLock,
  IconClock,
} from "../components/Icons";
import type { PublicView } from "../components/LandingLayout";

interface LegalPageProps {
  onNavigate: (view: PublicView) => void;
}

type LegalTab = "terms" | "privacy" | "dpa" | "sla";

export function LegalPage({ onNavigate }: LegalPageProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>("terms");

  return (
    <div className="legal-page animate-fade">
      {/* Hero Header */}
      <header className="legal-hero">
        <div className="hero-badge">Trust & Compliance Portal</div>
        <h1 className="legal-hero-title">Legal Terms & Compliance Policies</h1>
        <p className="legal-hero-subtitle">
          Praxis provides enterprise decision intelligence built upon strict mathematical verification,
          transparent governance, and industry-standard regulatory agreements.
        </p>
        <div className="legal-hero-meta">
          <span>Effective Date: January 1, 2026</span>
          <span>·</span>
          <span>Version 3.4.0 (Enterprise)</span>
          <span>·</span>
          <span>Applicable Worldwide</span>
        </div>
      </header>

      {/* 2-Column Layout: Sticky Sidebar on Left, Content on Right */}
      <div className="legal-container">
        <div className="legal-layout">
          {/* Sticky Sidebar Navigation */}
          <aside className="legal-sidebar" aria-label="Legal document sections">
            <div className="legal-sidebar-sticky">
              <span className="legal-nav-kicker">Legal Documents</span>
              <nav className="legal-nav-tabs">
                <button
                  type="button"
                  className={`legal-tab-btn ${activeTab === "terms" ? "active" : ""}`}
                  onClick={() => setActiveTab("terms")}
                >
                  <IconFileText size={16} />
                  <div className="legal-tab-text">
                    <strong>Terms of Service</strong>
                    <span>User terms, acceptable use & liability</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`legal-tab-btn ${activeTab === "privacy" ? "active" : ""}`}
                  onClick={() => setActiveTab("privacy")}
                >
                  <IconLock size={16} />
                  <div className="legal-tab-text">
                    <strong>Privacy Policy</strong>
                    <span>GDPR/CCPA & AI data processing</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`legal-tab-btn ${activeTab === "dpa" ? "active" : ""}`}
                  onClick={() => setActiveTab("dpa")}
                >
                  <IconShield size={16} />
                  <div className="legal-tab-text">
                    <strong>Data Processing Agreement</strong>
                    <span>Factory telemetry & security TOMs</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`legal-tab-btn ${activeTab === "sla" ? "active" : ""}`}
                  onClick={() => setActiveTab("sla")}
                >
                  <IconClock size={16} />
                  <div className="legal-tab-text">
                    <strong>Service Level Agreement</strong>
                    <span>99.95% uptime & support response times</span>
                  </div>
                </button>
              </nav>

              <div className="legal-sidebar-card">
                <h4>Have Compliance Questions?</h4>
                <p>Contact our Data Protection Officer and Legal Counsel.</p>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
                  onClick={() => onNavigate("contact")}
                >
                  Contact Legal Team
                </button>
              </div>
            </div>
          </aside>

          {/* Main Legal Content Article */}
          <main className="legal-content">
            {activeTab === "terms" && <TermsOfServiceContent />}
            {activeTab === "privacy" && <PrivacyPolicyContent />}
            {activeTab === "dpa" && <DpaContent />}
            {activeTab === "sla" && <SlaContent />}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   TAB 1: TERMS OF SERVICE
   ========================================================================== */
function TermsOfServiceContent() {
  return (
    <article className="legal-article animate-fade">
      <header className="legal-article-header">
        <span className="subject-badge">Legal Contract</span>
        <h2>Praxis Master Terms of Service (ToS)</h2>
        <p className="legal-doc-lead">
          These Terms of Service ("Agreement") govern access to and use of the Praxis Decision
          Intelligence Platform, including all APIs, formal verification engines, algorithms, and
          associated web dashboards provided by Praxis Platform, Inc. ("Praxis", "we", "us", or "our").
        </p>
      </header>

      <section className="legal-section">
        <h3>1. Acceptance of Terms & Organizational Authorization</h3>
        <p>
          By creating an account, accessing, or utilizing the Praxis Platform, the customer organization
          ("Customer", "you") agrees to be legally bound by this Agreement. If you are entering into
          this Agreement on behalf of a corporation, partnership, or other legal entity, you represent
          and warrant that you possess the lawful authority to bind such entity.
        </p>
      </section>

      <section className="legal-section">
        <h3>2. Description of Platform & Algorithmic Scope</h3>
        <p>
          Praxis provides an industrial decision intelligence platform that evaluates machine
          maintenance requests, validates physical parameters via Deterministic Finite Automata (DFA),
          predicts operational downtime and expenses via offline-trained machine learning models, and
          computes Pareto-optimal feasible interventions using graph-based shortest path algorithms
          (Dijkstra).
        </p>
        <p>
          Customer acknowledges that Praxis provides automated recommendations and decision-support
          scoring; final execution authority and physical implementation of any maintenance action
          remain strictly under the direction and supervision of Customer's designated human operators.
        </p>
      </section>

      <section className="legal-section">
        <h3>3. User Accounts, Authentication & Role-Based Access Control (RBAC)</h3>
        <p>
          Customer shall ensure all authorized users (including Technicians, Maintenance Supervisors,
          Production Supervisors, and Plant Managers) maintain the confidentiality of credentials.
          Customer is solely responsible for any action performed under its authorized accounts.
        </p>
        <p>
          Praxis enforces role-based authorization thresholds. Any attempt to forge JWT claims, bypass
          supervisor tier validations, or execute actions without designated credentials constitutes a
          material breach of this Agreement.
        </p>
      </section>

      <section className="legal-section">
        <h3>4. Acceptable Use Policy (AUP)</h3>
        <p>Customer agrees not to, and shall not permit any third party to:</p>
        <ul className="legal-list">
          <li>
            Reverse engineer, decompile, disassemble, or attempt to derive the underlying mathematical
            logic or algorithms of the DFA formal verification engine or optimization graphs;
          </li>
          <li>
            Transmit malicious, deliberately corrupted, or synthetically weaponized telemetry intended
            to cause denial of service or evade safety constraint checking;
          </li>
          <li>
            Circumvent rate limits, authentication barriers, or security defense overlays deployed on
            the API gateway;
          </li>
          <li>
            Resell, sublicense, or distribute Praxis algorithmic recommendations to third parties
            without express written authorization.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h3>5. Industrial Telemetry & Customer Data Ownership</h3>
        <p>
          As between Customer and Praxis, Customer retains all right, title, and interest (including all
          intellectual property rights) in and to all factory telemetry, operational sensor logs,
          equipment notes, and maintenance complaints submitted to the Platform ("Customer Data").
        </p>
        <p>
          Praxis is granted a non-exclusive, worldwide, royalty-free license solely to process and
          analyze Customer Data to execute decision loops, calculate constraint violations, and provide
          services under this Agreement.
        </p>
      </section>

      <section className="legal-section">
        <h3>6. Intellectual Property Rights</h3>
        <p>
          Praxis retains all right, title, and interest in and to the Platform, including the DFA
          formal language engine, graph optimization structures, scikit-learn models, APIs, user
          interfaces, documentation, and all improvements, modifications, or derivatives thereof.
        </p>
      </section>

      <section className="legal-section">
        <h3>7. Limitation of Liability & Warranty Disclaimers</h3>
        <p>
          EXCEPT AS EXPRESSLY SET FORTH HEREIN, THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE".
          PRAXIS DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL,
          OR PUNITIVE DAMAGES (INCLUDING LOSS OF FACTORY THROUGHPUT, REVENUE, PROFITS, OR CAPITAL
          EQUIPMENT DAMAGE) ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT. PRAXIS'S AGGREGATE
          LIABILITY SHALL NOT EXCEED THE TOTAL FEES PAID BY CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING
          THE EVENT GIVING RISE TO LIABILITY.
        </p>
      </section>

      <section className="legal-section">
        <h3>8. Termination & Suspension</h3>
        <p>
          Either party may terminate this Agreement upon thirty (30) days' written notice if the other
          party materially breaches this Agreement and fails to cure such breach within the notice
          period. Upon termination, Customer's right to access the Platform ceases immediately, and
          Praxis shall return or purge Customer Data in accordance with the Data Processing Agreement.
        </p>
      </section>

      <section className="legal-section">
        <h3>9. Governing Law & Dispute Resolution</h3>
        <p>
          This Agreement shall be governed by and construed in accordance with the laws of the State of
          California, without regard to its conflict of law principles. Any dispute arising out of or
          relating to this Agreement shall be resolved through binding arbitration administered by JAMS
          in Santa Clara County, California.
        </p>
      </section>
    </article>
  );
}

/* ==========================================================================
   TAB 2: PRIVACY POLICY
   ========================================================================== */
function PrivacyPolicyContent() {
  return (
    <article className="legal-article animate-fade">
      <header className="legal-article-header">
        <span className="subject-badge">Data Privacy</span>
        <h2>Praxis Enterprise Privacy Policy</h2>
        <p className="legal-doc-lead">
          Praxis Platform, Inc. ("Praxis", "we", "our") is committed to protecting the privacy of our
          users, technicians, plant supervisors, and organizational partners. This policy outlines our
          strict standards for data collection, algorithmic processing, and international privacy
          regulations (including GDPR and CCPA/CPRA).
        </p>
      </header>

      <section className="legal-section">
        <h3>1. Information We Collect</h3>
        <p>We collect only the minimum information necessary to provide decision intelligence:</p>
        <ul className="legal-list">
          <li>
            <strong>Account Credentials & Profile Data:</strong> Email addresses, hashed authentication
            records, role assignments (technician, maintenance_supervisor, production_supervisor,
            plant_manager), and session authentication tokens.
          </li>
          <li>
            <strong>Factory Telemetry & Operational Data:</strong> Machine identifiers, temperature
            readings, vibration measurements, operating hours, problem descriptions, severity ratings,
            and supervisor evaluation notes.
          </li>
          <li>
            <strong>Immutable Audit Logs:</strong> UTC timestamps, decision calculation traces,
            supervisor approvals, rejection conditions, and IP security headers.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h3>2. Artificial Intelligence & Machine Learning Policies</h3>
        <div className="legal-callout">
          <strong>Strict AI Guarantee:</strong> Your factory operational data is NEVER used to train
          public foundation models or shared with third-party generative LLMs.
        </div>
        <p>
          Our machine learning models (cost estimation, downtime prediction, risk scoring) operate on
          isolated tenant partitions using pre-trained weights. Predictions are derived deterministically
          and offline. We do not expose factory telemetry to third-party model providers, external
          APIs, or public datasets.
        </p>
      </section>

      <section className="legal-section">
        <h3>3. Legal Basis for Processing (GDPR Article 6)</h3>
        <p>We process data under the following lawful bases:</p>
        <ul className="legal-list">
          <li>
            <strong>Performance of Contract:</strong> To compute decision evaluations, enforce
            multi-tier approval hierarchies, and maintain platform security.
          </li>
          <li>
            <strong>Legitimate Interests:</strong> To prevent unauthorized lateral escalation, detect
            system abuse, and guarantee auditability for industrial safety compliance.
          </li>
          <li>
            <strong>Legal Obligation:</strong> To maintain tamper-evident records required by industrial
            safety, environmental, and insurance regulations.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h3>4. Cryptographic Security Standards</h3>
        <p>
          Praxis deploys state-of-the-art security controls across all architectural layers:
        </p>
        <ul className="legal-list">
          <li>
            <strong>In-Transit:</strong> TLS 1.3 encryption with strict HTTP Strict Transport Security
            (HSTS) and Perfect Forward Secrecy (PFS).
          </li>
          <li>
            <strong>At-Rest:</strong> Database volumes and telemetry archives encrypted using AES-256
            keys managed via enterprise hardware security modules (HSM).
          </li>
          <li>
            <strong>Session Security:</strong> Ephemeral JWT tokens with cryptographically signed
            signatures and automatic rotation upon logout.
          </li>
        </ul>
      </section>

      <section className="legal-section">
        <h3>5. Data Retention & Right to Erasure</h3>
        <p>
          Customer operational telemetry is retained for the duration of the active subscription plus
          ninety (90) days to support disaster recovery, after which it is cryptographically sanitized.
        </p>
        <p>
          Under GDPR (Articles 15–22) and CCPA/CPRA, authorized personnel retain the right to request
          access, export, rectification, or permanent deletion of personal data. Such requests may be
          directed to our Data Protection Officer at{" "}
          <a href="mailto:privacy@praxis-platform.com">privacy@praxis-platform.com</a>.
        </p>
      </section>
    </article>
  );
}

/* ==========================================================================
   TAB 3: DATA PROCESSING AGREEMENT (DPA)
   ========================================================================== */
function DpaContent() {
  return (
    <article className="legal-article animate-fade">
      <header className="legal-article-header">
        <span className="subject-badge">Enterprise Compliance</span>
        <h2>Data Processing Agreement (DPA)</h2>
        <p className="legal-doc-lead">
          This Data Processing Agreement ("DPA") supplements the Praxis Master Terms of Service. It
          reflects the parties' agreement regarding the processing of factory and personal data in
          accordance with European Union Regulation 2016/679 (GDPR), the UK Data Protection Act, and the
          California Consumer Privacy Act (CCPA).
        </p>
      </header>

      <section className="legal-section">
        <h3>1. Roles of the Parties</h3>
        <p>
          Customer is the <strong>Data Controller</strong> responsible for determining the lawful
          basis, accuracy, and operational purpose of all telemetry and employee records entered into the
          Platform. Praxis acts as the <strong>Data Processor</strong> processing such data solely on
          documented instructions from Customer.
        </p>
      </section>

      <section className="legal-section">
        <h3>2. Technical & Organizational Measures (TOMs)</h3>
        <p>
          Praxis maintains comprehensive technical and organizational measures designed to ensure a
          level of security appropriate to industrial risks, including:
        </p>
        <div className="legal-table-wrapper">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Security Domain</th>
                <th>Implemented Measure</th>
                <th>Verification Standard</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Access Control</td>
                <td>Multi-Tier RBAC, HMAC JWT session signatures, mandatory least privilege</td>
                <td>ISO/IEC 27001 / SOC 2 Type II</td>
              </tr>
              <tr>
                <td>Data Encryption</td>
                <td>AES-256 for all persistent storage; TLS 1.3 for all ingress/egress</td>
                <td>FIPS 140-3 validated crypto</td>
              </tr>
              <tr>
                <td>Input Validation</td>
                <td>Deterministic Finite Automata (DFA) state validation before processing</td>
                <td>FLAT Formal Verification</td>
              </tr>
              <tr>
                <td>Audit Integrity</td>
                <td>Append-only, immutable approval and outcome audit logging with UTC stamps</td>
                <td>Tamper-Evident SHA-256 Chains</td>
              </tr>
              <tr>
                <td>Network Defense</td>
                <td>Automated rate-limiting, CORS origin isolation, DDoS edge mitigations</td>
                <td>Cloud Native Edge WAF</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="legal-section">
        <h3>3. Sub-Processors</h3>
        <p>
          Customer grants general written authorization for Praxis to engage verified third-party
          sub-processors for cloud hosting, DNS routing, and enterprise database infrastructure. Praxis
          imposes data protection obligations no less protective than those in this DPA upon every
          sub-processor.
        </p>
        <p>
          Praxis maintains a current list of authorized sub-processors and shall notify Customer at least
          thirty (30) days in advance of any intended changes or additions.
        </p>
      </section>

      <section className="legal-section">
        <h3>4. Security Incident & Breach Notification</h3>
        <p>
          In the event of a confirmed Personal Data Breach or unauthorized access to Customer's factory
          telemetry, Praxis shall notify Customer's security contact without undue delay and, in any
          event, within <strong>seventy-two (72) hours</strong> of becoming aware of the incident.
        </p>
        <p>
          The notification shall describe the nature of the breach, affected records, likely consequences,
          and immediate mitigation measures taken.
        </p>
      </section>

      <section className="legal-section">
        <h3>5. Audit Rights & Compliance Certifications</h3>
        <p>
          Upon reasonable request and with at least thirty (30) days' advance notice, Praxis shall make
          available to Customer information necessary to demonstrate compliance with this DPA, including
          executive summaries of third-party security audits and penetration tests.
        </p>
      </section>
    </article>
  );
}

/* ==========================================================================
   TAB 4: SERVICE LEVEL AGREEMENT (SLA)
   ========================================================================== */
function SlaContent() {
  return (
    <article className="legal-article animate-fade">
      <header className="legal-article-header">
        <span className="subject-badge">Availability & Support</span>
        <h2>Enterprise Service Level Agreement (SLA)</h2>
        <p className="legal-doc-lead">
          This Service Level Agreement sets forth Praxis's commitments regarding platform uptime,
          decision engine API availability, and guaranteed incident response times for enterprise
          operational facilities.
        </p>
      </header>

      <section className="legal-section">
        <h3>1. Platform Uptime Commitment</h3>
        <p>
          Praxis guarantees a <strong>Monthly Uptime Percentage of at least 99.95%</strong> across all
          core services, including the Complaint Workflow API, DFA Formal Validation Engine, and
          Optimization Decision Loop.
        </p>
      </section>

      <section className="legal-section">
        <h3>2. Support Severity Levels & Response Times</h3>
        <div className="legal-table-wrapper">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Severity Tier</th>
                <th>Classification</th>
                <th>Guaranteed Response</th>
                <th>Target Resolution</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="severity-badge" data-sev="CRITICAL">
                    Severity 1 (Critical)
                  </span>
                </td>
                <td>
                  Core decision engine down; unable to evaluate complaints or record supervisor
                  approvals across factory operations.
                </td>
                <td>
                  <strong>&lt; 15 minutes</strong> (24/7/365)
                </td>
                <td>&lt; 2 hours continuous bridge</td>
              </tr>
              <tr>
                <td>
                  <span className="severity-badge" data-sev="HIGH">
                    Severity 2 (Major)
                  </span>
                </td>
                <td>
                  High system degradation; decision calculations experiencing elevated latency (&gt;5s)
                  or intermittent approval timeouts.
                </td>
                <td>
                  <strong>&lt; 1 hour</strong> (24/7/365)
                </td>
                <td>&lt; 6 hours</td>
              </tr>
              <tr>
                <td>
                  <span className="severity-badge" data-sev="MEDIUM">
                    Severity 3 (Moderate)
                  </span>
                </td>
                <td>
                  Non-critical feature issue; individual UI anomaly or report export failure with viable
                  workaround available.
                </td>
                <td>
                  <strong>&lt; 4 business hours</strong>
                </td>
                <td>Next minor release patch</td>
              </tr>
              <tr>
                <td>
                  <span className="severity-badge" data-sev="LOW">
                    Severity 4 (Low)
                  </span>
                </td>
                <td>
                  General inquiry, documentation clarification, or user enhancement request.
                </td>
                <td>
                  <strong>&lt; 24 business hours</strong>
                </td>
                <td>Backlog prioritization</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="legal-section">
        <h3>3. Service Credits & Compensation Schedule</h3>
        <p>
          If Praxis fails to meet the Monthly Uptime Commitment during any billing cycle, Customer is
          eligible to receive Service Credits applied to future invoice amounts:
        </p>
        <div className="legal-table-wrapper">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Monthly Availability Percentage</th>
                <th>Service Credit Applied</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>&lt; 99.95% but &ge; 99.0%</td>
                <td>
                  <strong>10%</strong> of monthly subscription fee
                </td>
              </tr>
              <tr>
                <td>&lt; 99.0% but &ge; 95.0%</td>
                <td>
                  <strong>25%</strong> of monthly subscription fee
                </td>
              </tr>
              <tr>
                <td>&lt; 95.0%</td>
                <td>
                  <strong>50%</strong> of monthly subscription fee
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="legal-section">
        <h3>4. Exclusions & Maintenance Windows</h3>
        <p>
          Downtime calculations exclude: (a) Scheduled maintenance announced at least five (5) business
          days in advance during standard off-peak windows (Sunday 02:00–06:00 UTC); (b) Customer network
          or ISP failures; (c) Force majeure events beyond reasonable commercial control.
        </p>
      </section>
    </article>
  );
}
