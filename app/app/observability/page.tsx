import { ObservabilityPanel } from "@/app/components/dashboard/observability-panel";

export default function ObservabilityPage() {
  return (
    <div style={{ padding: "1.5rem", display: "grid", gap: "1.25rem" }}>
      <header>
        <span className="pill workspace-header-pill">Observability</span>
        <h1 style={{ margin: "0.5rem 0 0.3rem", fontSize: "1.9rem", letterSpacing: "-0.02em" }}>
          Observability &amp; Tracing
        </h1>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
          Per-run latency, cost, agent path, cache status, and LangSmith trace links.
        </p>
      </header>

      <ObservabilityPanel />

      <section className="panel">
        <h3 style={{ marginTop: 0 }}>Explainability Notes</h3>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
          <div>
            <h4 style={{ margin: "0 0 0.4rem", color: "var(--accent)" }}>Agent Path</h4>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6 }}>
              Every run records the full agent routing chain — from orchestrator decision
              through to the specialized agent that handled the response.
            </p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 0.4rem", color: "var(--accent)" }}>Cost &amp; Latency</h4>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6 }}>
              Token estimates and USD cost are tracked per run. Slow runs above 1200ms are
              flagged. LangSmith trace URLs link directly to the full span timeline.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
