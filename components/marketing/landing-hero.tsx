export function LandingHero() {
  return (
    <section
      className="panel"
      style={{ maxWidth: 940, margin: "1.5rem auto", padding: "1.5rem" }}
    >
      <div className="pill">Axiom Premium</div>
      <h1 style={{ fontSize: "2.25rem", margin: "0.7rem 0" }}>
        Build safer AI operations with approvals, memory, and capability
        controls in one control plane.
      </h1>
      <p className="muted" style={{ lineHeight: 1.6, maxWidth: 760 }}>
        Route work across specialized agents, enforce high-risk approvals, and
        apply entitlement-based access controls from a centralized policy
        engine.
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginTop: "1rem",
          flexWrap: "wrap",
        }}
      >
        <a className="pill" href="/signin" style={{ textDecoration: "none" }}>
          Request Access
        </a>
        <a href="/app" style={{ textDecoration: "none", color: "var(--text)" }}>
          Enter Workspace
        </a>
      </div>
    </section>
  );
}
