const mockMessages = [
  {
    role: "user",
    content:
      "Prepare a launch plan for IMDEV's premium AI advisor with trial conversion goals.",
  },
  {
    role: "axiom",
    content:
      "I can help. Confirm the primary KPI: trial-to-paid conversion, retention, or team productivity. I will optimize milestones and risk controls accordingly.",
  },
] as const;

export function ChatPanel() {
  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>AI Advisor</h2>
      <p className="muted" style={{ marginTop: "-0.2rem" }}>
        Clarification-first guidance with memory context, access-aware gating,
        and approval-ready recommendations.
      </p>
      <div className="grid" style={{ gap: "0.7rem", marginTop: "1rem" }}>
        {mockMessages.map((msg) => (
          <div
            key={msg.content}
            style={{
              background:
                msg.role === "axiom"
                  ? "rgba(91, 140, 255, 0.1)"
                  : "var(--panel-soft)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "0.75rem",
            }}
          >
            <strong
              style={{ textTransform: "capitalize", fontSize: "0.85rem" }}
            >
              {msg.role}
            </strong>
            <p style={{ margin: "0.45rem 0 0", lineHeight: 1.45 }}>
              {msg.content}
            </p>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: "0.8rem",
          padding: "0.6rem",
          borderRadius: 10,
          border: "1px dashed var(--border)",
        }}
      >
        <span className="muted">
          Advisor status: connected to policy hooks, access snapshot, and
          approval flow.
        </span>
      </div>
    </div>
  );
}
