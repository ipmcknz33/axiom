import { getServerEnv } from "@/lib/env";

export type ObservabilityConfig = {
  /** Whether LangSmith run tracing is enabled. */
  tracingEnabled: boolean;
  /** LangSmith API key. Undefined means tracing is disabled. */
  apiKey?: string;
  /** LangSmith project name to group runs under. */
  project: string;
  /** LangSmith ingestion endpoint. Defaults to hosted API. */
  endpoint: string;
  /** Builds a hosted trace URL for a given run ID, or returns undefined when tracing is off. */
  buildTraceUrl: (runId: string) => string | undefined;
};

const DEFAULT_ENDPOINT = "https://api.smith.langchain.com";
const DEFAULT_PROJECT = "axiom-dev";

let observabilityConfigCache: ObservabilityConfig | undefined;

/**
 * Returns observability/tracing configuration derived from environment.
 * Tracing is only active when both LANGSMITH_API_KEY and LANGSMITH_TRACING=true are set.
 */
export function getObservabilityConfig(): ObservabilityConfig {
  if (!observabilityConfigCache) {
    const env = getServerEnv();
    const tracingEnabled =
      env.LANGSMITH_TRACING === "true" && Boolean(env.LANGSMITH_API_KEY);

    observabilityConfigCache = {
      tracingEnabled,
      apiKey: env.LANGSMITH_API_KEY,
      project: env.LANGSMITH_PROJECT ?? DEFAULT_PROJECT,
      endpoint: env.LANGCHAIN_ENDPOINT ?? DEFAULT_ENDPOINT,
      buildTraceUrl: (runId: string) =>
        tracingEnabled
          ? `https://smith.langchain.com/runs/${runId}`
          : undefined,
    };
  }

  return observabilityConfigCache;
}
