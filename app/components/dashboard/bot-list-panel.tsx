"use client";

import { useEffect, useState } from "react";

type BotRequest = {
  capabilities: string[];
  createdAt: string;
  id: string;
  intent: string;
  name: string;
  status: "queued" | "processing" | "ready";
};

const DEMO_HEADERS = {
  "x-axiom-role": "admin",
  "x-axiom-user-id": "11111111-1111-4111-8111-111111111111",
};

const STATUS_COLOR: Record<BotRequest["status"], string> = {
  queued: "#fbbf24",
  processing: "#60a5fa",
  ready: "#86efac",
};

export function BotListPanel() {
  const [bots, setBots] = useState<BotRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/v1/bots", { headers: DEMO_HEADERS })
      .then((r) => r.json())
      .then(
        (payload: {
          data?: { requests: BotRequest[] };
          error?: { message?: string };
        }) => {
          if (payload.data) {
            setBots(payload.data.requests);
          } else {
            setError(payload.error?.message ?? "Failed to load bots.");
          }
        },
      )
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0, marginBottom: "0.85rem" }}>Active Bots</h3>

      {loading && <p className="muted">Loading bots…</p>}
      {error && <p style={{ color: "#fda4af" }}>{error}</p>}

      {!loading && !error && bots.length === 0 && (
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          No bots yet. Create one using the panel on the left.
        </p>
      )}

      <div style={{ display: "grid", gap: "0.6rem" }}>
        {bots.map((bot) => (
          <div
            key={bot.id}
            className="panel"
            style={{ padding: "0.75rem", background: "rgba(17,23,37,0.5)" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
                  {bot.name}
                </div>
                <div
                  className="muted"
                  style={{ fontSize: "0.8rem", lineHeight: 1.5 }}
                >
                  {bot.intent}
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "0.2rem 0.55rem",
                  borderRadius: 9999,
                  background: "rgba(0,0,0,0.3)",
                  color: STATUS_COLOR[bot.status],
                  whiteSpace: "nowrap",
                }}
              >
                {bot.status}
              </span>
            </div>
            {bot.capabilities.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "0.4rem",
                  flexWrap: "wrap",
                  marginTop: "0.5rem",
                }}
              >
                {bot.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="pill"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            )}
            <div
              className="muted"
              style={{ fontSize: "0.72rem", marginTop: "0.45rem" }}
            >
              Created {new Date(bot.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
