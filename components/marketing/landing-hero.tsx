const SYSTEM_HIGHLIGHTS = [
  {
    label: "Graph Orchestration",
    detail: "normalize → route → retrieve → respond",
  },
  {
    label: "RAG Retrieval",
    detail: "pgvector-first, deterministic in-memory fallback",
  },
  {
    label: "Approval Gates",
    detail: "high-risk policy enforcement before dispatch",
  },
  {
    label: "Observability",
    detail: "per-run latency, cost, agent path, cache status",
  },
];

const SIGNAL_CARDS = [
  { label: "Agents active", value: "4" },
  { label: "Runs today", value: "128" },
  { label: "Avg latency", value: "340ms" },
  { label: "Cache hit rate", value: "61%" },
];

const TERMINAL_LINES = [
  { label: "normalize", text: "query → lowercase + collapse whitespace" },
  { label: "route", text: "intent matched → builder agent selected" },
  { label: "retrieve", text: "pgvector RPC → 4 context docs (score 0.82)" },
  { label: "respond", text: "synthesis complete → 312 tokens" },
];

export function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="hero-layout">
        {/* Left column */}
        <div className="hero-left">
          <div className="pill" style={{ marginBottom: "1rem" }}>
            Axiom — AI Operations Platform
          </div>
          <h1 className="hero-headline">
            Secure AI operations built for teams that can&apos;t afford to
            guess.
          </h1>
          <p className="muted hero-sub">
            Route work across specialized agents, enforce approval gates on
            high-risk actions, and observe every run end-to-end — from a single
            policy-driven control plane.
          </p>

          <ul className="hero-highlights">
            {SYSTEM_HIGHLIGHTS.map((item) => (
              <li key={item.label} className="hero-highlight">
                <span className="hero-highlight__label">{item.label}</span>
                <span className="muted hero-highlight__detail">
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>

          <a
            href="/app"
            className="btn-primary"
            style={{ marginTop: "1.5rem", display: "inline-block" }}
          >
            Enter Workspace
          </a>
        </div>

        {/* Right column */}
        <div className="hero-right">
          <div className="hero-signal-cards">
            {SIGNAL_CARDS.map((card) => (
              <div key={card.label} className="hero-signal-card">
                <p className="muted" style={{ margin: 0, fontSize: "0.75rem" }}>
                  {card.label}
                </p>
                <strong style={{ fontSize: "1.4rem" }}>{card.value}</strong>
              </div>
            ))}
          </div>

          <div className="hero-terminal">
            <p
              className="muted"
              style={{
                margin: "0 0 0.5rem",
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
              }}
            >
              PIPELINE TRACE — run_d4a9bc12
            </p>
            {TERMINAL_LINES.map((line) => (
              <div key={line.label} className="hero-terminal-line">
                <span className="hero-terminal-node">{line.label}</span>
                <span className="muted">{line.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
