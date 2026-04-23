import { getAiConfig } from "@/lib/ai-config";
import { getAuthContext } from "@/server/security/auth";
import { getRagStats } from "@/server/rag/store";
import { getTracingStatus } from "@/server/ai/tracing";
import { getProviderStatus } from "@/server/ai/provider";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { NextRequest } from "next/server";

/**
 * GET /api/v1/ai/runtime
 *
 * Returns the current runtime mode for LLM, RAG, embeddings, and tracing.
 * Visible in the observability panel. Admin/service only.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth.ok) {
    return createApiError(401, auth.error ?? "Unauthorized");
  }
  if (auth.role !== "admin" && auth.role !== "service") {
    return createApiError(403, "Forbidden");
  }

  const config = getAiConfig();
  const provider = getProviderStatus();
  const ragStats = getRagStats();
  const tracing = getTracingStatus();

  return createApiResponse({
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
    // surface for debugging: which env keys are present (never the values)
    keysPresent: {
      OPENAI_API_KEY: Boolean(config.llm.apiKey),
      LANGSMITH_API_KEY: Boolean(config.tracing.apiKey),
    },
  });
}
