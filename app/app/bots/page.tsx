import { BotCreationPanel } from "@/app/components/dashboard/bot-creation-panel";
import { BotListPanel } from "@/app/components/dashboard/bot-list-panel";

export default function BotsPage() {
  return (
    <div style={{ padding: "1.5rem", display: "grid", gap: "1.25rem" }}>
      <header>
        <span className="pill workspace-header-pill">Bots</span>
        <h1
          style={{
            margin: "0.5rem 0 0.3rem",
            fontSize: "1.9rem",
            letterSpacing: "-0.02em",
          }}
        >
          Bot Management
        </h1>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
          Create, configure, and monitor autonomous bots for any workflow.
        </p>
      </header>

      <section className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <BotCreationPanel />
        <BotListPanel />
      </section>
    </div>
  );
}
