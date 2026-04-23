export type PipelineRunRecord = {
  agent: "orchestrator" | "research" | "builder" | "debugger";
  cacheHit: boolean;
  contextCount: number;
  error?: string;
  latencyMs: number;
  query: string;
  runId: string;
  timestamp: string;
  tokenEstimate: number;
  userId: string;
};

export type TelemetrySummary = {
  avgLatencyMs: number;
  cacheHitRate: number;
  errorCount: number;
  requestCount: number;
  totalTokens: number;
};

type TelemetryRuntimeState = {
  runs: PipelineRunRecord[];
};

const MAX_RUN_HISTORY = 150;

declare global {
  // eslint-disable-next-line no-var
  var __axiomTelemetryState: TelemetryRuntimeState | undefined;
}

function getRuntimeState(): TelemetryRuntimeState {
  if (!globalThis.__axiomTelemetryState) {
    globalThis.__axiomTelemetryState = {
      runs: [],
    };
  }

  return globalThis.__axiomTelemetryState;
}

export function trackRun(run: PipelineRunRecord) {
  const state = getRuntimeState();
  state.runs.unshift(run);
  if (state.runs.length > MAX_RUN_HISTORY) {
    state.runs.length = MAX_RUN_HISTORY;
  }
}

export function getTelemetrySummary(): TelemetrySummary {
  const state = getRuntimeState();
  const requestCount = state.runs.length;

  if (requestCount === 0) {
    return {
      avgLatencyMs: 0,
      cacheHitRate: 0,
      errorCount: 0,
      requestCount: 0,
      totalTokens: 0,
    };
  }

  const totalLatency = state.runs.reduce((sum, run) => sum + run.latencyMs, 0);
  const totalTokens = state.runs.reduce(
    (sum, run) => sum + run.tokenEstimate,
    0,
  );
  const cacheHits = state.runs.reduce(
    (sum, run) => sum + (run.cacheHit ? 1 : 0),
    0,
  );
  const errorCount = state.runs.reduce(
    (sum, run) => sum + (run.error ? 1 : 0),
    0,
  );

  return {
    avgLatencyMs: Math.round(totalLatency / requestCount),
    cacheHitRate: Number((cacheHits / requestCount).toFixed(3)),
    errorCount,
    requestCount,
    totalTokens,
  };
}

export function getRecentRuns(limit = 12): PipelineRunRecord[] {
  const state = getRuntimeState();
  return state.runs.slice(0, Math.max(1, limit));
}
