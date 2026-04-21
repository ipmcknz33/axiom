import { AgentOverview } from "@/app/components/dashboard/agent-overview";
import { ChatPanel } from "@/app/components/dashboard/chat-panel";
import { ConnectorPanel } from "@/app/components/dashboard/connector-panel";
import { MemoryPanel } from "@/app/components/dashboard/memory-panel";
import { ProjectPanel } from "@/app/components/dashboard/project-panel";

export default function HomePage() {
  return (
    <main>
      <header style={{ marginBottom: "1.25rem" }}>
        <span className="pill">Axiom · Phase 1 Foundation</span>
        <h1 style={{ margin: "0.75rem 0 0.35rem", fontSize: "2rem" }}>
          AI Operating System Control Plane
        </h1>
        <p className="muted" style={{ maxWidth: 740, margin: 0 }}>
          A security-first, modular, and API-first platform for orchestrating
          specialized agents, memory retrieval, connectors, approvals, and
          intelligent collaboration.
        </p>
      </header>

      <section
        className="grid"
        style={{ gridTemplateColumns: "2fr 1fr", marginBottom: "1rem" }}
      >
        <ChatPanel />
        <AgentOverview />
      </section>

      <section className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <ProjectPanel />
        <MemoryPanel />
        <ConnectorPanel />
      </section>
    </main>
  );
}
