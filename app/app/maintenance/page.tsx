import { MaintenancePanel } from "@/app/components/dashboard/maintenance-panel";

export default function MaintenancePage() {
  return (
    <div style={{ padding: "1.5rem", display: "grid", gap: "1.25rem" }}>
      <header>
        <span className="pill workspace-header-pill">Maintenance</span>
        <h1 style={{ margin: "0.5rem 0 0.3rem", fontSize: "1.9rem", letterSpacing: "-0.02em" }}>
          System Maintenance
        </h1>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
          Runtime health checks, seed management, and demo environment controls.
        </p>
      </header>

      <MaintenancePanel />

      <section className="panel">
        <h3 style={{ marginTop: 0 }}>Maintenance Guide</h3>
        <ul className="muted" style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.9, fontSize: "0.85rem" }}>
          <li>Use <strong style={{ color: "var(--text)" }}>Refresh Checks</strong> to re-poll LLM, RAG, and tracing runtime status.</li>
          <li>Use <strong style={{ color: "var(--text)" }}>Reseed Data</strong> to restore demo documents to the RAG store.</li>
          <li>LLM check verifies the configured provider is reachable and responding.</li>
          <li>RAG check confirms at least one document chunk is present in the store.</li>
          <li>Tracing check confirms LangSmith or stub tracer is initialised.</li>
        </ul>
      </section>
    </div>
  );
}
