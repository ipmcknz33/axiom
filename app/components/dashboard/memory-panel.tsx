const memorySources = [
  "Session memory",
  "Repo memory",
  "Connector snapshots",
] as const;

export function MemoryPanel() {
  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Memory</h3>
      <p className="muted">
        Multi-scope retrieval with explicit recency and source controls.
      </p>
      <ul
        style={{ margin: "0.9rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.7 }}
      >
        {memorySources.map((source) => (
          <li key={source}>{source}</li>
        ))}
      </ul>
    </div>
  );
}
