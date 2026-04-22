const phases = [
  "Discovery and benchmark",
  "Permission and approval setup",
  "Premium launch rollout",
] as const;

export function ProjectPanel() {
  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Projects and Tasks</h3>
      <p className="muted">
        Track milestones, ownership, and risk through a single operational
        queue.
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
