const baseAgents = [
  { name: "Orchestrator", scope: "Routing, policy, collaboration", status: "active" },
  { name: "Research Analyst", scope: "Retrieval, synthesis, citations", status: "template" },
  { name: "Project Operator", scope: "Tasks, milestones, dependencies", status: "template" },
  { name: "Finance Guard", scope: "Approval-gated financial actions", status: "template" }
] as const;

export function AgentOverview() {
  return (
    <aside className="panel">
      <h2 style={{ marginTop: 0 }}>Agent Registry</h2>
      <p className="muted">Controlled templates with least-privilege tool grants and scoped memory.</p>
      <div className="grid" style={{ marginTop: "0.9rem" }}>
        {baseAgents.map((agent) => (
          <div key={agent.name} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "0.7rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{agent.name}</strong>
              <span className="pill" style={{ fontSize: "0.65rem" }}>
                {agent.status}
              </span>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>{agent.scope}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}