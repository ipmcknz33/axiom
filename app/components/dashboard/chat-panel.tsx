const mockMessages = [
  { role: "user", content: "Build me a project plan for launching an analytics assistant in 90 days." },
  {
    role: "axiom",
    content:
      "Before I propose a plan: is your primary KPI user adoption, revenue, or internal productivity? I can tailor trade-offs and probability-weighted risk scenarios."
  }
] as const;

export function ChatPanel() {
  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>Axiom Chat</h2>
      <p className="muted" style={{ marginTop: "-0.2rem" }}>
        Clarification-first reasoning with memory-aware context and approval-aware action planning.
      </p>
      <div className="grid" style={{ gap: "0.7rem", marginTop: "1rem" }}>
        {mockMessages.map((msg) => (
          <div
            key={msg.content}
            style={{
              background: msg.role === "axiom" ? "rgba(91, 140, 255, 0.1)" : "var(--panel-soft)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "0.75rem"
            }}
          >
            <strong style={{ textTransform: "capitalize", fontSize: "0.85rem" }}>{msg.role}</strong>
            <p style={{ margin: "0.45rem 0 0", lineHeight: 1.45 }}>{msg.content}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "0.8rem", padding: "0.6rem", borderRadius: 10, border: "1px dashed var(--border)" }}>
        <span className="muted">Input shell (phase 1): message composer + model route + policy hooks.</span>
      </div>
    </div>
  );
}