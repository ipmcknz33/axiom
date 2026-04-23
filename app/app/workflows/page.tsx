import { WorkflowsPanel } from "@/app/components/dashboard/workflows-panel";

export default function WorkflowsPage() {
  return (
    <div style={{ padding: "1.5rem", display: "grid", gap: "1.25rem" }}>
      <header>
        <span className="pill workspace-header-pill">Workflows</span>
        <h1 style={{ margin: "0.5rem 0 0.3rem", fontSize: "1.9rem", letterSpacing: "-0.02em" }}>
          Workflow Execution
        </h1>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
          Trigger and monitor multi-step automated workflows across agents.
        </p>
      </header>

      <WorkflowsPanel />
    </div>
  );
}
