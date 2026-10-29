import { useState } from "react";
import { type PublicView } from "../components/LandingLayout";
import {
  IconArrowRight,
  IconCheckCircle,
  IconShield,
  IconSliders,
  IconLock,
  IconZap,
  IconUsers,
} from "../components/Icons";

interface BusinessPageProps {
  onNavigate?: (view: PublicView) => void;
  onGetStarted: () => void;
}

interface CustomRole {
  id: string;
  name: string;
  tier: number;
  maxApproval: number;
  canOverride: boolean;
}

export function BusinessPage({ onNavigate, onGetStarted }: BusinessPageProps) {
  // Interactive Mock Customizer State
  const [tier1Limit, setTier1Limit] = useState<number>(25000);
  const [tier2Limit, setTier2Limit] = useState<number>(150000);
  const [strictDfa, setStrictDfa] = useState<boolean>(true);
  const [auditHashing, setAuditHashing] = useState<boolean>(true);
  const [humanInLoop, setHumanInLoop] = useState<boolean>(true);
  const [tenantIsolation, setTenantIsolation] = useState<"row_level" | "isolated_schema" | "air_gapped">("isolated_schema");

  const [roles, setRoles] = useState<CustomRole[]>([
    { id: "1", name: "Field Technician", tier: 0, maxApproval: 0, canOverride: false },
    { id: "2", name: "Maintenance Supervisor", tier: 1, maxApproval: 25000, canOverride: false },
    { id: "3", name: "Operations Director", tier: 2, maxApproval: 150000, canOverride: true },
    { id: "4", name: "Plant VP / GM", tier: 3, maxApproval: 1000000, canOverride: true },
  ]);

  const [newRoleName, setNewRoleName] = useState("");

  function handleAddRole() {
    if (!newRoleName.trim()) return;
    const newRole: CustomRole = {
      id: Date.now().toString(),
      name: newRoleName.trim(),
      tier: roles.length,
      maxApproval: 50000,
      canOverride: false,
    };
    setRoles([...roles, newRole]);
    setNewRoleName("");
  }

  function handleRemoveRole(id: string) {
    if (roles.length <= 2) return; // Keep minimum 2 roles
    setRoles(roles.filter((r) => r.id !== id));
  }

  // Generated JSON schema for live preview
  const generatedPolicy = {
    organization: "acme-enterprise-workspace",
    isolation_tier: tenantIsolation,
    dfa_engine: {
      strict_state_invariants: strictDfa,
      immutable_sha256_ledger: auditHashing,
      mandatory_human_review_above: humanInLoop ? `₹${tier1Limit.toLocaleString("en-IN")}` : "DISABLED",
    },
    approval_thresholds: {
      tier_1_supervisor_limit: `₹${tier1Limit.toLocaleString("en-IN")}`,
      tier_2_director_limit: `₹${tier2Limit.toLocaleString("en-IN")}`,
      unlimited_executive_escalation: true,
    },
    active_role_hierarchy: roles.map((r) => ({
      role: r.name,
      tier: r.tier,
      max_authorization: r.maxApproval === 0 ? "Submission Only" : `₹${r.maxApproval.toLocaleString("en-IN")}`,
      emergency_override: r.canOverride,
    })),
  };

  return (
    <div className="business-page animate-fade" style={{ maxWidth: "1140px", margin: "0 auto", padding: "40px 20px 80px" }}>
      {/* Top Banner */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 16px",
            borderRadius: "999px",
            background: "rgba(139, 92, 246, 0.12)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            color: "#a78bfa",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }} />
          Enterprise & Industrial B2B Platform
        </div>

        <h1
          style={{
            fontSize: "clamp(34px, 5vw, 56px)",
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#f8fafc",
            maxWidth: "880px",
            margin: "0 auto 20px",
          }}
        >
          Govern industrial operations with{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #38bdf8 50%, #4ade80 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            air-gapped formal safety.
          </span>
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#94a3b8",
            maxWidth: "720px",
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Empower multi-facility operations, plant directors, and critical infrastructure with custom multi-tenant
          hierarchies, zero-leak isolation, and mathematically proven Deterministic Finite Automata (DFA).
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", alignItems: "center" }}>
          <button
            onClick={onGetStarted}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 34px",
              fontSize: "16px",
              fontWeight: 700,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)",
            }}
          >
            Request B2B Workspace
            <IconArrowRight size={18} />
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate("now")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 24px",
                fontSize: "15px",
                fontWeight: 600,
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.04)",
                color: "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                cursor: "pointer",
              }}
            >
              Read our Manifesto →
            </button>
          )}
        </div>
      </div>

      {/* Enterprise Capabilities Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          marginBottom: "64px",
        }}
      >
        <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <IconUsers size={22} color="#a78bfa" />
            <h4 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>Multi-Tier Hierarchy</h4>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
            Model technicians, line supervisors, plant engineers, and corporate executives with exact financial thresholds.
          </p>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <IconShield size={22} color="#38bdf8" />
            <h4 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>Zero-Leak Multi-Tenancy</h4>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
            Strict tenant partition barriers with cryptographic SHA-256 audit log chaining across all operational events.
          </p>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <IconZap size={22} color="#4ade80" />
            <h4 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>Real-Time SCADA/ERP</h4>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
            Plug-and-play REST & webhook gateways for SAP, Siemens SIMATIC, Rockwell FactoryTalk, and Honeywell Forge.
          </p>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <IconLock size={22} color="#f59e0b" />
            <h4 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>SOC 2 & Air-Gapped</h4>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
            Deploy in your private AWS, GCP, or Azure VPC, or as a completely air-gapped container on internal hardware.
          </p>
        </div>
      </div>

      {/* Interactive Mock "Role & Rule Customizer" Form */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)",
          border: "1px solid rgba(139, 92, 246, 0.35)",
          borderRadius: "24px",
          padding: "36px",
          marginBottom: "64px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ marginBottom: "28px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <IconSliders size={24} color="#a78bfa" />
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
              Interactive Enterprise Rule & Role Customizer
            </h2>
          </div>
          <p style={{ color: "#94a3b8", fontSize: "15px", margin: 0 }}>
            Configure operational authority, approval thresholds, and DFA safety invariants below to test how Praxis models your enterprise governance.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "36px" }}>
          {/* Controls Column */}
          <div>
            {/* Approval Sliders */}
            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>
                  Tier 1 Supervisor Max Approval:
                </label>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#38bdf8" }}>
                  ₹{tier1Limit.toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="50000"
                step="5000"
                value={tier1Limit}
                onChange={(e) => setTier1Limit(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
              />
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                Interventions below this cost can be authorized by Level 1 supervisors without escalating.
              </div>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>
                  Tier 2 Director Max Approval:
                </label>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#a78bfa" }}>
                  ₹{tier2Limit.toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="50000"
                max="500000"
                step="25000"
                value={tier2Limit}
                onChange={(e) => setTier2Limit(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#a78bfa", cursor: "pointer" }}
              />
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                Orders exceeding this limit require Plant General Manager or VP executive sign-off.
              </div>
            </div>

            {/* Invariant Toggles */}
            <div style={{ marginBottom: "28px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", display: "block", marginBottom: "12px" }}>
                Deterministic Invariants & Safety Gates
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#cbd5e1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={strictDfa}
                    onChange={(e) => setStrictDfa(e.target.checked)}
                    style={{ accentColor: "#a78bfa", width: "16px", height: "16px" }}
                  />
                  Enforce strict DFA formal state transitions (Disallow unverified state hops)
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#cbd5e1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={auditHashing}
                    onChange={(e) => setAuditHashing(e.target.checked)}
                    style={{ accentColor: "#a78bfa", width: "16px", height: "16px" }}
                  />
                  Cryptographic SHA-256 state hashing for every decision transition
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#cbd5e1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={humanInLoop}
                    onChange={(e) => setHumanInLoop(e.target.checked)}
                    style={{ accentColor: "#a78bfa", width: "16px", height: "16px" }}
                  />
                  Mandatory human-in-the-loop signoff for high risk or downtime actions
                </label>
              </div>
            </div>

            {/* Tenant Isolation Mode */}
            <div style={{ marginBottom: "28px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", display: "block", marginBottom: "8px" }}>
                Tenant Storage Isolation Level
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["row_level", "isolated_schema", "air_gapped"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTenantIsolation(mode)}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "1px solid",
                      borderColor: tenantIsolation === mode ? "#a78bfa" : "rgba(255,255,255,0.1)",
                      background: tenantIsolation === mode ? "rgba(139, 92, 246, 0.2)" : "rgba(255,255,255,0.03)",
                      color: tenantIsolation === mode ? "#f8fafc" : "#94a3b8",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {mode.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Role List & Add Role */}
            <div>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", display: "block", marginBottom: "8px" }}>
                Manage Operational Roles
              </label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input
                  type="text"
                  placeholder="e.g. Safety Inspector, Quality Lead"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#f8fafc",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddRole}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#7c3aed",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  + Add Role
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {roles.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "12px",
                      color: "#cbd5e1",
                    }}
                  >
                    <span>{r.name}</span>
                    {roles.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(r.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: "0 2px",
                          fontSize: "14px",
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Code / Schema Preview Column */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Live Generated DFA Policy (JSON)
              </span>
              <span style={{ fontSize: "11px", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                <IconCheckCircle size={13} color="#10b981" /> Valid Invariant Tree
              </span>
            </div>

            <pre
              style={{
                background: "#090d16",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "12px",
                lineHeight: 1.5,
                color: "#7dd3fc",
                overflowX: "auto",
                maxHeight: "420px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              {JSON.stringify(generatedPolicy, null, 2)}
            </pre>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <button
                onClick={onGetStarted}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Provision This Workspace Scheme →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise SLA & Compliance Bar */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "20px",
          padding: "36px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-around",
          alignItems: "center",
          gap: "24px",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "32px", fontWeight: 900, color: "#f8fafc" }}>99.99%</div>
          <div style={{ fontSize: "13px", color: "#94a3b8" }}>Guaranteed Uptime SLA</div>
        </div>
        <div style={{ width: "1px", height: "40px", background: "rgba(255, 255, 255, 0.1)" }} />
        <div>
          <div style={{ fontSize: "32px", fontWeight: 900, color: "#38bdf8" }}>0ms</div>
          <div style={{ fontSize: "13px", color: "#94a3b8" }}>State Violation Window</div>
        </div>
        <div style={{ width: "1px", height: "40px", background: "rgba(255, 255, 255, 0.1)" }} />
        <div>
          <div style={{ fontSize: "32px", fontWeight: 900, color: "#4ade80" }}>SOC 2</div>
          <div style={{ fontSize: "13px", color: "#94a3b8" }}>Type II Certified Ready</div>
        </div>
        <div style={{ width: "1px", height: "40px", background: "rgba(255, 255, 255, 0.1)" }} />
        <div>
          <div style={{ fontSize: "32px", fontWeight: 900, color: "#a78bfa" }}>Air-Gapped</div>
          <div style={{ fontSize: "13px", color: "#94a3b8" }}>On-Premise Ready</div>
        </div>
      </div>
    </div>
  );
}
