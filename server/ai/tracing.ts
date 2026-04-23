/**
 * server/ai/tracing.ts
 *
 * LangSmith trace start/end helpers + conditional trace URL resolution.
 * All calls are no-ops when tracing is disabled — callers never need to guard.
 *
 * Uses native fetch to post run metadata; does not bundle the LangSmith SDK.
 */
import { getAiConfig } from "@/lib/ai-config";

export type TraceRunInput = {
  runId: string;
  name: string;
  runType: "chain" | "llm" | "retriever" | "tool";
  inputs: Record<string, unknown>;
  startedAt: number;
  tags?: string[];
};

export type TraceRunEnd = {
  runId: string;
  outputs: Record<string, unknown>;
  error?: string;
  endedAt: number;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function postToLangSmith(
  path: string,
  body: unknown,
  apiKey: string,
  endpoint: string,
): Promise<void> {
  try {
    await fetch(`${endpoint}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Never throw — tracing failures must not break the request path
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Posts a run-start event to LangSmith. No-op when tracing is disabled.
 */
export async function startTrace(input: TraceRunInput): Promise<void> {
  const { tracing } = getAiConfig();
  if (!tracing.isEnabled || !tracing.apiKey) return;

  await postToLangSmith(
    "/runs",
    {
      id: input.runId,
      name: input.name,
      run_type: input.runType,
      inputs: input.inputs,
      start_time: new Date(input.startedAt).toISOString(),
      project_name: tracing.project,
      tags: input.tags ?? [],
    },
    tracing.apiKey,
    tracing.endpoint,
  );
}

/**
 * Posts a run-end event to LangSmith. No-op when tracing is disabled.
 */
export async function endTrace(input: TraceRunEnd): Promise<void> {
  const { tracing } = getAiConfig();
  if (!tracing.isEnabled || !tracing.apiKey) return;

  await postToLangSmith(
    `/runs/${input.runId}`,
    {
      outputs: input.outputs,
      error: input.error,
      end_time: new Date(input.endedAt).toISOString(),
    },
    tracing.apiKey,
    tracing.endpoint,
  );
}

/**
 * Returns a LangSmith trace URL for the given runId, or undefined if tracing
 * is not enabled.
 */
export function buildTraceUrl(runId: string): string | undefined {
  return getAiConfig().tracing.buildTraceUrl(runId);
}

/** Returns the current tracing mode without side effects. */
export function getTracingStatus() {
  const { tracing } = getAiConfig();
  return {
    mode: tracing.mode,
    project: tracing.project,
    isEnabled: tracing.isEnabled,
  };
}
