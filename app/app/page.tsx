import Link from "next/link";
import { AgentOverview } from "@/app/components/dashboard/agent-overview";
import { MemoryPanel } from "@/app/components/dashboard/memory-panel";
import { ObservabilityPanel } from "@/app/components/dashboard/observability-panel";
import { MaintenancePanel } from "@/app/components/dashboard/maintenance-panel";

const STATUS_CARDS = [
  { label: "LLM", value: "Online", ok: true },
  { label: "RAG", value: "Seeded", ok: true },
  { label: "Tracing", value: "Active", ok: true },
  { label: "Approvals", value: "Enforced", ok: true },
];

const SIGNAL_CARDS = [
  { label: "Active bots", value: "3" },
  { label: "Workflows today", value: "12" },
  { label: "Avg latency", value: "340ms" },
  { label: "Cache hit rate", value: "61%" },
];

const QUICK_LINKS = [
  { href: "/app/bots", label: "Manage Bots" },
  { href: "/app/workflows", label: "Run Workflow" },
  { href: "/app/memory", label: "Browse Memory" },
  { href: "/app/observability", label: "View Traces" },
  { href: "/app/maintenance", label: "System Check" },
];

export default function CockpitPage() {
  return (
    <div style={{ padding: "1.5rem", display: "grid", gap: "1.25rem" }}>
      <header>
        <span className="pill workspace-header-pill">Cockpit</span>
        <h1
          style={{
            margin: "0.5rem 0 0.3rem",
            fontSize: "1.9rem",
            letterSpacing: "-0.02em",
          }}
        >
          AI Operations Control Plane
        </h1>
        <p
          className="muted"
          style={{ margin: 0, maxWidth: 620, lineHeight: 1.55 }}
        >
          Orchestrate agents, enforce approvals, observe every run —
          policy-driven, end to end.
        </p>
      </header>

      <section
        className="grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {STATUS_CARDS.map((c) => (
          <div
            key={c.label}
            className="panel"
            style={{ textAlign: "center", padding: "0.85rem" }}
          >
            <div
              className="muted"
              style={{ fontSize: "0.75rem", marginBottom: "0.3rem" }}
            >
              {c.label}
            </div>
            <div
              style={{ fontWeight: 600, color: c.ok ? "#86efac" : "#fda4af" }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </section>

      <section
        className="grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {SIGNAL_CARDS.map((c) => (
          <div key={c.label} className="panel" style={{ padding: "0.85rem" }}>
            <div
              className="muted"
              style={{ fontSize: "0.75rem", marginBottom: "0.3rem" }}
            >
              {c.label}
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h3 style={{ marginTop: 0, marginBottom: "0.85rem" }}>Quick Actions</h3>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shell-nav-link"
              style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <AgentOverview />
        <MemoryPanel />
      </section>

      <ObservabilityPanel />

      <MaintenancePanel compact />
    </div>
  );
}
