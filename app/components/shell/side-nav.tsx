const navItems = [
  { href: "/app", label: "Cockpit" },
  { href: "/app/bots", label: "Bots" },
  { href: "/app/workflows", label: "Workflows" },
  { href: "/app/memory", label: "Memory" },
  { href: "/app/observability", label: "Observability" },
  { href: "/app/maintenance", label: "Maintenance" },
] as const;

export function SideNav() {
  return (
    <aside className="shell-side panel panel-premium">
      <div
        className="pill workspace-header-pill"
        style={{ marginBottom: "0.6rem" }}
      >
        IMDEV Studios
      </div>
      <h2
        style={{
          marginBottom: "0.3rem",
          fontSize: "1.1rem",
          letterSpacing: "-0.01em",
        }}
      >
        Axiom
      </h2>
      <p
        className="muted"
        style={{ marginTop: 0, fontSize: "0.78rem", lineHeight: 1.5 }}
      >
        Policy-driven AI operations platform.
      </p>
      <nav style={{ marginTop: "0.85rem", display: "grid", gap: "0.45rem" }}>
        {navItems.map((item) => (
          <a key={item.label} href={item.href} className="shell-nav-link">
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
