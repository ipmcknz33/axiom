export type PipelineRunRecord = {
  agent: "orchestrator" | "research" | "builder" | "debugger";
  agentPath: string[];
  cacheHit: boolean;
  contextCount: number;
  estimatedCostUsd: number;
  error?: string;
  latencyMs: number;
  llmMode: "openai" | "stub";
  llmModel: string;
  normalizedQuery: string;
  query: string;
  ragMode: "memory" | "postgres";
  ragUsed: boolean;
  runId: string;
  timestamp: string;
  tokenEstimate: number;
  traceUrl?: string;
  userId: string;
};

export type TelemetrySummary = {
  avgLatencyMs: number;
  cacheHitRate: number;
  errorCount: number;
  estimatedCostUsd: number;
  requestCount: number;
  retrievalCount: number;
  slowRuns: number;
  totalTokens: number;
};

type TelemetryRuntimeState = {
  runs: PipelineRunRecord[];
};

const MAX_RUN_HISTORY = 150;
const SLOW_RUN_THRESHOLD_MS = 1200;

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
      estimatedCostUsd: 0,
      requestCount: 0,
      retrievalCount: 0,
      slowRuns: 0,
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
  const retrievalCount = state.runs.reduce(
    (sum, run) => sum + run.contextCount,
    0,
  );
  const slowRuns = state.runs.reduce(
    (sum, run) => sum + (run.latencyMs >= SLOW_RUN_THRESHOLD_MS ? 1 : 0),
    0,
  );
  const estimatedCostUsd = state.runs.reduce(
    (sum, run) => sum + run.estimatedCostUsd,
    0,
  );

  return {
    avgLatencyMs: Math.round(totalLatency / requestCount),
    cacheHitRate: Number((cacheHits / requestCount).toFixed(3)),
    errorCount,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
    requestCount,
    retrievalCount,
    slowRuns,
    totalTokens,
  };
}

export function getRecentRuns(limit = 12): PipelineRunRecord[] {
  const state = getRuntimeState();
  return state.runs.slice(0, Math.max(1, limit));
}
