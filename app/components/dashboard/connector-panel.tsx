export function ConnectorPanel() {
  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Connectors & Settings</h3>
      <p className="muted">
        Add-on registry with secure OAuth, scoped permissions, and auditability.
      </p>
      <ul
        style={{ margin: "0.9rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.7 }}
      >
        <li>Google, email, calendar, docs</li>
        <li>Finance/API adapters (approval-gated)</li>
        <li>Credential vault integration (phase 2)</li>
      </ul>
    </div>
  );
}
