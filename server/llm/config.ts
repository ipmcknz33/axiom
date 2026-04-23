import { getServerEnv } from "@/lib/env";

export type LlmProvider = "openai" | "stub";

export type LlmConfig = {
  /** Active provider. Falls back to "stub" until OPENAI_API_KEY is set. */
  provider: LlmProvider;
  /** API key for the active provider. Undefined means stub mode. */
  apiKey?: string;
  /** Chat completion model to use. Defaults to gpt-4o-mini. */
  model: string;
  /** Embedding model to use. Defaults to text-embedding-3-small. */
  embeddingModel: string;
  /** Whether a real LLM provider is available. */
  isLive: boolean;
};

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

let llmConfigCache: LlmConfig | undefined;

/**
 * Returns LLM configuration derived from environment.
 * Returns stub config (isLive: false) when OPENAI_API_KEY is not set —
 * the existing deterministic orchestrator pipeline continues to operate normally.
 */
export function getLlmConfig(): LlmConfig {
  if (!llmConfigCache) {
    const env = getServerEnv();
    const apiKey = env.OPENAI_API_KEY;

    llmConfigCache = {
      provider: apiKey ? "openai" : "stub",
      apiKey,
      model: env.OPENAI_MODEL ?? DEFAULT_MODEL,
      embeddingModel: env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL,
      isLive: Boolean(apiKey),
    };
  }

  return llmConfigCache;
}
