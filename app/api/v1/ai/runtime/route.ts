import { getAiConfig } from "@/lib/ai-config";
import { getAuthContext } from "@/server/security/auth";
import { getRagStats } from "@/server/rag/store";
import { getTracingStatus } from "@/server/ai/tracing";
import { getProviderStatus } from "@/server/ai/provider";
import { fail, ok } from "@/lib/api/response";

/**
 * GET /api/v1/ai/runtime
 *
 * Returns the current runtime mode for LLM, RAG, embeddings, and tracing.
 * Visible in the observability panel. Admin/service only.
 */
export async function GET(request: Request) {
  const auth = getAuthContext(request.headers);
  if (!auth.success) {
    return fail(auth.error, 401, "unauthenticated");
  }
  if (auth.data.role !== "admin" && auth.data.role !== "service") {
    return fail("Forbidden", 403, "forbidden");
  }

  const config = getAiConfig();
  const provider = getProviderStatus();
  const ragStats = getRagStats();
  const tracing = getTracingStatus();

  return ok({
    llm: {
      mode: provider.llm,
      model: provider.model,
      isLive: provider.isLive,
    },
    embeddings: {
      mode: provider.embeddings,
      model: provider.embeddingsModel,
    },
    rag: {
      backendMode: ragStats.mode === "postgres" ? "pgvector" : "memory",
      embeddingsMode: ragStats.embeddingsMode,
      isSeeded: ragStats.isSeeded,
      chunks: ragStats.chunks,
    },
    tracing: {
      mode: tracing.mode,
      project: tracing.project,
      isEnabled: tracing.isEnabled,
    },
    keysPresent: {
      OPENAI_API_KEY: Boolean(config.llm.apiKey),
      LANGSMITH_API_KEY: Boolean(config.tracing.apiKey),
    },
  });
}
