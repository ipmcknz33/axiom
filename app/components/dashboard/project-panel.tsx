const phases = ["Discovery", "Security baseline", "MVP rollout"] as const;

export function ProjectPanel() {
  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Projects</h3>
      <p className="muted">
        Tracking milestones, owners, and delivery risk across workstreams.
      </p>
      <ul
        style={{ margin: "0.9rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.7 }}
      >
        {phases.map((phase) => (
          <li key={phase}>{phase}</li>
        ))}
      </ul>
    </div>
  );
}
