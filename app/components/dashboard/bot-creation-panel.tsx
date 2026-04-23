"use client";

import { useState } from "react";

type BotCapability = "chat" | "workflow" | "research" | "monitoring";

type BotRequest = {
  capabilities: BotCapability[];
  createdAt: string;
  id: string;
  intent: string;
  name: string;
  status: "queued" | "processing" | "ready";
};

const CAPABILITIES: Array<{ label: string; value: BotCapability }> = [
  { label: "Chat", value: "chat" },
  { label: "Workflow", value: "workflow" },
  { label: "Research", value: "research" },
  { label: "Monitoring", value: "monitoring" },
];

const DEMO_HEADERS = {
  "Content-Type": "application/json",
  "x-axiom-role": "admin",
  "x-axiom-user-id": "11111111-1111-4111-8111-111111111111",
};

export function BotCreationPanel() {
  const [name, setName] = useState("");
  const [intent, setIntent] = useState("");
  const [caps, setCaps] = useState<Set<BotCapability>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<BotRequest[]>([]);
  const [created, setCreated] = useState<BotRequest | null>(null);

  function toggleCap(cap: BotCapability) {
    setCaps((prev) => {
      const next = new Set(prev);
      if (next.has(cap)) {
        next.delete(cap);
      } else {
        next.add(cap);
      }

      return next;
    });
  }

  async function submit() {
    if (busy) return;
    setError(null);
    setBusy(true);
    setCreated(null);

    try {
      const response = await fetch("/api/v1/bots", {
        method: "POST",
        headers: DEMO_HEADERS,
        body: JSON.stringify({
          capabilities: [...caps],
          intent,
          name,
        }),
      });

      const payload = (await response.json()) as {
        data?: { bot: BotRequest };
        error?: { message?: string };
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Failed to create bot.");
      }

      setCreated(payload.data.bot);
      setQueue((prev) => [payload.data!.bot, ...prev].slice(0, 8));
      setName("");
      setIntent("");
      setCaps(new Set());
      setConfirmed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bot.");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    name.trim().length > 0 &&
    intent.trim().length > 0 &&
    caps.size > 0 &&
    confirmed &&
    !busy;

  return (
    <div className="panel panel-premium">
      <h3 style={{ margin: "0 0 0.75rem" }}>Bot Creator</h3>

      <div style={{ display: "grid", gap: "0.55rem" }}>
        <div>
          <p className="muted" style={{ margin: "0 0 0.25rem", fontSize: "0.8rem" }}>
            Bot name
          </p>
          <input
            className="billing-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Invoice Reconciler"
            disabled={busy}
          />
        </div>

        <div>
          <p className="muted" style={{ margin: "0 0 0.25rem", fontSize: "0.8rem" }}>
            Task intent
          </p>
          <input
            className="billing-input"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="e.g. Match and reconcile weekly invoices"
            disabled={busy}
          />
        </div>

        <div>
          <p className="muted" style={{ margin: "0 0 0.35rem", fontSize: "0.8rem" }}>
            Capabilities
          </p>
          <div className="bot-cap-grid">
            {CAPABILITIES.map((cap) => (
              <button
                key={cap.value}
                className={`bot-cap-btn${caps.has(cap.value) ? " bot-cap-btn--on" : ""}`}
                onClick={() => toggleCap(cap.value)}
                disabled={busy}
                type="button"
              >
                {cap.label}
              </button>
            ))}
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={busy}
          />
          <span className="muted">
            I confirm this bot request should be queued for deployment
          </span>
        </label>

        <button
          className="btn-primary"
          onClick={submit}
          disabled={!canSubmit}
          type="button"
        >
          {busy ? "Queuing..." : "Create Bot"}
        </button>
      </div>

      {error ? <p className="upgrade-error">{error}</p> : null}

      {created ? (
        <div
          className="status-banner status-success"
          style={{ marginTop: "0.75rem" }}
        >
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            <strong>{created.name}</strong> queued as{" "}
            <code style={{ fontSize: "0.78rem" }}>{created.id}</code>
          </p>
        </div>
      ) : null}

      {queue.length > 0 ? (
        <div style={{ marginTop: "0.9rem" }}>
          <p
            className="muted"
            style={{ margin: "0 0 0.4rem", fontSize: "0.8rem" }}
          >
            Recent requests
          </p>
          <div style={{ display: "grid", gap: "0.35rem" }}>
            {queue.map((req) => (
              <div
                key={req.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "0.45rem 0.6rem",
                  background: "rgba(17,23,37,0.6)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.85rem" }}>{req.name}</span>
                  <span
                    className="pill"
                    style={{ fontSize: "0.68rem", alignSelf: "center" }}
                  >
                    {req.status}
                  </span>
                </div>
                <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.78rem" }}>
                  {req.capabilities.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
