"use client";

import { useCallback, useEffect, useState } from "react";

type MetricsPayload = {
  rag: {
    cacheEntries: number;
    chunks: number;
    documents: number;
    isSeeded: boolean;
    mode: "memory" | "postgres";
  };
  recentRuns: Array<{
    agent: "orchestrator" | "research" | "builder" | "debugger";
    agentPath: string[];
    cacheHit: boolean;
    contextCount: number;
    estimatedCostUsd: number;
    latencyMs: number;
    normalizedQuery: string;
    query: string;
    ragUsed: boolean;
    runId: string;
    timestamp: string;
    tokenEstimate: number;
    traceUrl?: string;
  }>;
  summary: {
    avgLatencyMs: number;
    cacheHitRate: number;
    errorCount: number;
    estimatedCostUsd: number;
    requestCount: number;
    retrievalCount: number;
    slowRuns: number;
    totalTokens: number;
  };
};

const DEMO_HEADERS = {
  "x-axiom-role": "admin",
  "x-axiom-user-id": "11111111-1111-4111-8111-111111111111",
};

const SLOW_QUERY_THRESHOLD_MS = 1200;

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
        <div className="observability-card">
          <p className="muted">Requests</p>
          <strong>{metrics?.summary.requestCount ?? 0}</strong>
        </div>
        <div className="observability-card">
          <p className="muted">Avg latency</p>
          <strong>{metrics?.summary.avgLatencyMs ?? 0}ms</strong>
        </div>
        <div className="observability-card">
          <p className="muted">Cache hit</p>
          <strong>
            {Math.round((metrics?.summary.cacheHitRate ?? 0) * 100)}%
          </strong>
        </div>
        <div className="observability-card">
          <p className="muted">Errors</p>
          <strong>{metrics?.summary.errorCount ?? 0}</strong>
        </div>
        <div className="observability-card">
          <p className="muted">Retrieval docs</p>
          <strong>{metrics?.summary.retrievalCount ?? 0}</strong>
        </div>
        <div className="observability-card">
          <p className="muted">Slow runs</p>
          <strong>{metrics?.summary.slowRuns ?? 0}</strong>
        </div>
        <div className="observability-card">
          <p className="muted">Est cost</p>
          <strong>
            ${(metrics?.summary.estimatedCostUsd ?? 0).toFixed(4)}
          </strong>
        </div>
      </div>

      <p className="muted" style={{ marginTop: "0.8rem" }}>
        RAG seeded: {metrics?.rag.isSeeded ? "yes" : "no"} | docs:{" "}
        {metrics?.rag.documents ?? 0} | chunks: {metrics?.rag.chunks ?? 0} |
        cached queries: {metrics?.rag.cacheEntries ?? 0} | mode:{" "}
        {metrics?.rag.mode ?? "memory"}
      </p>

      {error ? <p className="upgrade-error">{error}</p> : null}

      <div className="observability-runs" style={{ marginTop: "0.85rem" }}>
        {(metrics?.recentRuns?.length ?? 0) === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No runs yet. Use the assistant demo actions, then refresh to inspect
            traces.
          </p>
        ) : (
          (metrics?.recentRuns ?? []).slice(0, 6).map((run) => (
            <div
              key={run.runId}
              className={`observability-run${run.latencyMs > SLOW_QUERY_THRESHOLD_MS ? " observability-run--slow" : ""}`}
            >
              <div
                className="feature-row"
                style={{ borderBottom: "none", paddingBottom: 0 }}
              >
                <span>{run.agent}</span>
                <span className="muted">{run.latencyMs}ms</span>
              </div>
              <p className="muted" style={{ margin: "0.3rem 0 0" }}>
                {run.normalizedQuery}
              </p>
              <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                rag {run.ragUsed ? "used" : "none"} | cache{" "}
                {run.cacheHit ? "hit" : "miss"} | context {run.contextCount} |
                tokens {run.tokenEstimate} | cost $
                {run.estimatedCostUsd.toFixed(6)}
              </p>
              <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                path {run.agentPath.join(" -> ")}
              </p>
              {run.traceUrl ? (
                <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                  trace {run.traceUrl}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
