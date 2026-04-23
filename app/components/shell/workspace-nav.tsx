"use client";

import Link from "next/link";

export function WorkspaceNav() {
  return (
    <header className="workspace-nav">
      <div className="workspace-nav-brand">
        <span className="pill workspace-header-pill">IMDEV Studios</span>
        <span className="workspace-nav-title">Axiom</span>
      </div>
      <nav className="workspace-nav-links">
        <Link href="/app" className="workspace-nav-link">
          Cockpit
        </Link>
        <Link href="/app/bots" className="workspace-nav-link">
          Bots
        </Link>
        <Link href="/app/workflows" className="workspace-nav-link">
          Workflows
        </Link>
        <Link href="/app/memory" className="workspace-nav-link">
          Memory
        </Link>
        <Link href="/app/observability" className="workspace-nav-link">
          Observability
        </Link>
        <Link href="/app/maintenance" className="workspace-nav-link">
          Maintenance
        </Link>
      </nav>
      <form action="/api/v1/auth/signout" method="post">
        <button
          type="submit"
          className="btn-primary"
          style={{ fontSize: "0.78rem", padding: "0.38rem 0.9rem" }}
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
