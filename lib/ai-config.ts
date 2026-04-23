/**
 * lib/ai-config.ts
 *
 * Centralized AI / observability config with mode resolution.
 * All server-side AI code reads from here — never from process.env directly.
 *
 * Mode summary:
 *   llm:        "openai" when OPENAI_API_KEY is set, else "stub"
 *   embeddings: "openai" when OPENAI_API_KEY is set, else "deterministic"
 *   rag:        "pgvector" when Supabase path is available, else "memory"
 *               (resolved at runtime by the RAG store, not statically here)
 *   tracing:    "langsmith" when LANGSMITH_API_KEY + LANGSMITH_TRACING=true, else "disabled"
 */
import { getServerEnv } from "@/lib/env";

export type LlmMode = "openai" | "stub";
export type EmbeddingsMode = "openai" | "deterministic";
export type TracingMode = "langsmith" | "disabled";

export type AiConfig = {
  llm: {
    mode: LlmMode;
    apiKey?: string;
    /** Chat model. Defaults to gpt-4o-mini. */
    chatModel: string;
    /** Embedding model. Defaults to text-embedding-3-small. */
    embeddingsModel: string;
    isLive: boolean;
  };
  embeddings: {
    mode: EmbeddingsMode;
  };
  tracing: {
    mode: TracingMode;
    apiKey?: string;
    project: string;
    endpoint: string;
    isEnabled: boolean;
    /** Returns a trace URL for runId when tracing is enabled, else undefined. */
    buildTraceUrl: (runId: string) => string | undefined;
  };
};

const DEFAULT_CHAT_MODEL = "gpt-4o-mini";
const DEFAULT_EMBEDDINGS_MODEL = "text-embedding-3-small";
const DEFAULT_LANGSMITH_ENDPOINT = "https://api.smith.langchain.com";
const DEFAULT_LANGSMITH_PROJECT = "axiom-dev";

let aiConfigCache: AiConfig | undefined;

/**
 * Returns the AI runtime config derived from server environment variables.
 * Safe to call on every request — result is module-level cached after first call.
 */
export function getAiConfig(): AiConfig {
  if (!aiConfigCache) {
    const env = getServerEnv();

    const openaiKey = env.OPENAI_API_KEY;
    const langsmithKey = env.LANGSMITH_API_KEY;

    // LANGSMITH_TRACING accepts: "true", "1", "on", "yes" (case-insensitive)
    const langsmithTracingRaw = (env.LANGSMITH_TRACING ?? "").toLowerCase();
    const tracingActive =
      Boolean(langsmithKey) &&
      ["true", "1", "on", "yes"].includes(langsmithTracingRaw);

    const tracingEndpoint =
      env.LANGCHAIN_ENDPOINT ?? DEFAULT_LANGSMITH_ENDPOINT;
    const tracingProject = env.LANGSMITH_PROJECT ?? DEFAULT_LANGSMITH_PROJECT;

    aiConfigCache = {
      llm: {
        mode: openaiKey ? "openai" : "stub",
        apiKey: openaiKey,
        chatModel: env.OPENAI_MODEL ?? DEFAULT_CHAT_MODEL,
        embeddingsModel: env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDINGS_MODEL,
        isLive: Boolean(openaiKey),
      },
      embeddings: {
        mode: openaiKey ? "openai" : "deterministic",
      },
      tracing: {
        mode: tracingActive ? "langsmith" : "disabled",
        apiKey: langsmithKey,
        project: tracingProject,
        endpoint: tracingEndpoint,
        isEnabled: tracingActive,
        buildTraceUrl: (runId: string) =>
          tracingActive
            ? `https://smith.langchain.com/runs/${runId}`
            : undefined,
      },
    };
  }

  return aiConfigCache;
}

/** Convenience: true when a live OpenAI API key is available. */
export function isLlmLive(): boolean {
  return getAiConfig().llm.isLive;
}

/** Convenience: true when LangSmith tracing is fully configured and enabled. */
export function isTracingEnabled(): boolean {
  return getAiConfig().tracing.isEnabled;
}
