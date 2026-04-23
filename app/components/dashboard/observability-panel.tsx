"use client";

import { useCallback, useEffect, useState } from "react";

type MetricsPayload = {
  rag: {
    cacheEntries: number;
    chunks: number;
    documents: number;
  };
  recentRuns: Array<{
    agent: "orchestrator" | "research" | "builder" | "debugger";
    cacheHit: boolean;
    contextCount: number;
    latencyMs: number;
    runId: string;
    timestamp: string;
    tokenEstimate: number;
  }>;
  summary: {
    avgLatencyMs: number;
    cacheHitRate: number;
    errorCount: number;
    requestCount: number;
    totalTokens: number;
  };
};

const DEMO_HEADERS = {
  "x-axiom-role": "admin",
  "x-axiom-user-id": "11111111-1111-4111-8111-111111111111",
};

export function ObservabilityPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/ai/metrics", {
        headers: DEMO_HEADERS,
        method: "GET",
      });

      const payload = (await response.json()) as {
        data?: MetricsPayload;
        error?: { message?: string };
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to load metrics.");
      }

      setMetrics(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div className="panel">
      <div className="observability-header">
        <h3 style={{ margin: 0 }}>Observability</h3>
        <button
          className="upgrade-btn"
          onClick={loadMetrics}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="observability-grid" style={{ marginTop: "0.9rem" }}>
        <div className="permission-card">
          <p className="muted">Requests</p>
          <strong>{metrics?.summary.requestCount ?? 0}</strong>
        </div>
        <div className="permission-card">
          <p className="muted">Avg latency</p>
          <strong>{metrics?.summary.avgLatencyMs ?? 0}ms</strong>
        </div>
        <div className="permission-card">
          <p className="muted">Tokens</p>
          <strong>{metrics?.summary.totalTokens ?? 0}</strong>
        </div>
        <div className="permission-card">
          <p className="muted">Cache hit rate</p>
          <strong>
            {Math.round((metrics?.summary.cacheHitRate ?? 0) * 100)}%
          </strong>
        </div>
      </div>

      <p className="muted" style={{ marginTop: "0.8rem" }}>
        RAG documents: {metrics?.rag.documents ?? 0} | chunks:{" "}
        {metrics?.rag.chunks ?? 0} | cached queries:{" "}
        {metrics?.rag.cacheEntries ?? 0}
      </p>

      {error ? <p className="upgrade-error">{error}</p> : null}

      <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.5rem" }}>
        {(metrics?.recentRuns ?? []).slice(0, 5).map((run) => (
          <div className="permission-card" key={run.runId}>
            <div
              className="feature-row"
              style={{ borderBottom: "none", paddingBottom: 0 }}
            >
              <span>{run.agent}</span>
              <span className="muted">{run.latencyMs}ms</span>
            </div>
            <p className="muted" style={{ margin: "0.35rem 0 0" }}>
              tokens {run.tokenEstimate} | context {run.contextCount} | cache{" "}
              {run.cacheHit ? "hit" : "miss"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
