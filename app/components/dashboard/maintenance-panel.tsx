"use client";

import { useCallback, useState } from "react";

type CheckStatus = "idle" | "ok" | "error" | "loading";

type RuntimeCheck = {
  label: string;
  key: string;
  status: CheckStatus;
  detail: string;
};

const DEMO_HEADERS = {
  "x-axiom-role": "admin",
  "x-axiom-user-id": "11111111-1111-4111-8111-111111111111",
};

const STATUS_COLOR: Record<CheckStatus, string> = {
  idle: "var(--muted)",
  ok: "#86efac",
  error: "#fda4af",
  loading: "#60a5fa",
};

const INITIAL_CHECKS: RuntimeCheck[] = [
  {
    label: "LLM Provider",
    key: "llm",
    status: "idle",
    detail: "Not checked yet",
  },
  { label: "RAG Store", key: "rag", status: "idle", detail: "Not checked yet" },
  {
    label: "Tracing",
    key: "tracing",
    status: "idle",
    detail: "Not checked yet",
  },
];

type MaintenancePanelProps = {
  compact?: boolean;
};

export function MaintenancePanel({ compact = false }: MaintenancePanelProps) {
  const [checks, setChecks] = useState<RuntimeCheck[]>(INITIAL_CHECKS);
  const [reseeding, setReseeding] = useState(false);
  const [reseedMsg, setReseedMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const setCheckStatus = (key: string, status: CheckStatus, detail: string) => {
    setChecks((prev) =>
      prev.map((c) => (c.key === key ? { ...c, status, detail } : c)),
    );
  };

  const refreshChecks = useCallback(async () => {
    setChecking(true);
    setChecks((prev) =>
      prev.map((c) => ({ ...c, status: "loading", detail: "Checking…" })),
    );

    try {
      const res = await fetch("/api/v1/ai/runtime", { headers: DEMO_HEADERS });
      const payload = (await res.json()) as {
        data?: {
          llm: { isLive: boolean; mode: string; model: string };
          rag: { isSeeded: boolean; chunks: number };
          tracing: { isEnabled: boolean; mode: string };
        };
        error?: { message?: string };
      };

      if (!res.ok || !payload.data) {
        const msg = payload.error?.message ?? "Check failed";
        INITIAL_CHECKS.forEach((c) => setCheckStatus(c.key, "error", msg));
      } else {
        const { llm, rag, tracing } = payload.data;
        setCheckStatus(
          "llm",
          llm.isLive ? "ok" : "error",
          `${llm.mode} / ${llm.model}`,
        );
        setCheckStatus(
          "rag",
          rag.isSeeded ? "ok" : "error",
          `${rag.chunks} chunks`,
        );
        setCheckStatus(
          "tracing",
          tracing.isEnabled ? "ok" : "error",
          tracing.mode,
        );
      }
    } catch {
      INITIAL_CHECKS.forEach((c) =>
        setCheckStatus(c.key, "error", "Network error"),
      );
    } finally {
      setChecking(false);
    }
  }, []);

  const reseed = useCallback(async () => {
    setReseeding(true);
    setReseedMsg(null);
    try {
      const res = await fetch("/api/v1/rag/seed", {
        method: "POST",
        headers: DEMO_HEADERS,
      });
      const payload = (await res.json()) as {
        data?: { documentCount: number };
        error?: { message?: string };
      };
      if (res.ok && payload.data) {
        setReseedMsg(`Reseeded ${payload.data.documentCount} documents.`);
      } else {
        setReseedMsg(payload.error?.message ?? "Reseed failed.");
      }
    } catch {
      setReseedMsg("Network error during reseed.");
    } finally {
      setReseeding(false);
    }
  }, []);

  return (
    <div className="panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.85rem",
        }}
      >
        <h3 style={{ margin: 0 }}>
          {compact ? "Maintenance Snapshot" : "Runtime Checks"}
        </h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn-primary"
            onClick={refreshChecks}
            disabled={checking}
            style={{ fontSize: "0.78rem", padding: "0.38rem 0.8rem" }}
          >
            {checking ? "Checking…" : "Refresh Checks"}
          </button>
          {!compact && (
            <button
              className="btn-primary"
              onClick={reseed}
              disabled={reseeding}
              style={{
                fontSize: "0.78rem",
                padding: "0.38rem 0.8rem",
                background: "rgba(91,140,255,0.15)",
              }}
            >
              {reseeding ? "Reseeding…" : "Reseed Data"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.5rem" }}>
        {checks.map((check) => (
          <div
            key={check.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px dashed var(--border)",
              paddingBottom: "0.45rem",
            }}
          >
            <div style={{ fontWeight: 500, fontSize: "0.88rem" }}>
              {check.label}
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  color: STATUS_COLOR[check.status],
                  fontWeight: 600,
                  fontSize: "0.82rem",
                }}
              >
                {check.status === "loading"
                  ? "…"
                  : check.status === "idle"
                    ? "—"
                    : check.status}
              </span>
              <div className="muted" style={{ fontSize: "0.73rem" }}>
                {check.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      {reseedMsg && (
        <p
          style={{
            margin: "0.75rem 0 0",
            fontSize: "0.83rem",
            color: "#86efac",
          }}
        >
          {reseedMsg}
        </p>
      )}
    </div>
  );
}
