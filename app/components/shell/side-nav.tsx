const navItems = [
  { href: "/app", label: "Overview" },
  { href: "/app?tab=advisor", label: "AI Advisor" },
  { href: "/app?tab=projects", label: "Projects" },
  { href: "/app?tab=agents", label: "Agents" },
  { href: "/app?tab=memory", label: "Memory" },
  { href: "/app?tab=connectors", label: "Connectors" },
] as const;

export function SideNav() {
  return (
    <aside className="shell-side panel">
      <div className="pill">IMDEV Studios</div>
      <h2 style={{ marginBottom: "0.35rem" }}>Axiom Shell</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Flagship premium workspace for secure AI operations.
      </p>
      <nav style={{ marginTop: "0.8rem", display: "grid", gap: "0.5rem" }}>
        {navItems.map((item) => (
          <a key={item.label} href={item.href} className="shell-nav-link">
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
