export function PermissionPanel() {
  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Permission Request Explainability</h3>
      <p className="muted">
        High-risk actions trigger explicit permission prompts with rationale and
        impact summaries.
      </p>
      <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.55rem" }}>
        <div className="permission-card">
          <strong>Requested capability</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Execute production code change via deployment connector.
          </p>
        </div>
        <div className="permission-card">
          <strong>Why it is needed</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Required to implement approved patch and close the incident
            workflow.
          </p>
        </div>
        <div className="permission-card">
          <strong>If denied</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Task remains pending and operation escalates to manual operator
            handoff.
          </p>
        </div>
      </div>
    </div>
  );
}
