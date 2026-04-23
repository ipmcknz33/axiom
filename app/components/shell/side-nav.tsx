const navItems = [
  { href: "/app", label: "Overview" },
  { href: "/app?tab=advisor", label: "AI Advisor" },
  { href: "/app?tab=bots", label: "Bot Creator" },
  { href: "/app?tab=projects", label: "Projects" },
  { href: "/app?tab=agents", label: "Agents" },
  { href: "/app?tab=memory", label: "Memory" },
  { href: "/app?tab=connectors", label: "Connectors" },
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
