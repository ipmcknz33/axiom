import { MemoryPanel } from "@/app/components/dashboard/memory-panel";

export default function MemoryPage() {
  return (
    <div style={{ padding: "1.5rem", display: "grid", gap: "1.25rem" }}>
      <header>
        <span className="pill workspace-header-pill">Memory</span>
        <h1 style={{ margin: "0.5rem 0 0.3rem", fontSize: "1.9rem", letterSpacing: "-0.02em" }}>
          Memory &amp; Knowledge
        </h1>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
          Multi-scope retrieval with provenance-aware ranking and recency controls.
        </p>
      </header>

      <MemoryPanel />

      <section className="panel">
        <h3 style={{ marginTop: 0 }}>How Memory Works</h3>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
          <div>
            <h4 style={{ margin: "0 0 0.4rem", color: "var(--accent)" }}>Ingestion</h4>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6 }}>
              Documents are chunked, embedded, and stored in pgvector (or in-memory fallback).
              Each chunk retains source provenance and ingest timestamp for recency scoring.
            </p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 0.4rem", color: "var(--accent)" }}>Retrieval</h4>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6 }}>
              Queries are embedded and ranked by cosine similarity. Results are scoped per
              session or agent run, ensuring grounded, context-relevant responses.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
