import { trackRun } from "@/server/ai/telemetry";
import { retrieveRelevantChunks } from "@/server/rag/store";

type AgentRole = "orchestrator" | "research" | "builder" | "debugger";

export type QueryPipelineInput = {
  query: string;
  role: "admin" | "service" | "user";
  topK?: number;
  userId: string;
};

export type QueryPipelineOutput = {
  agent: AgentRole;
  cacheHit: boolean;
  contextCount: number;
  context: Array<{
    id: string;
    score: number;
    source?: string;
    title: string;
  }>;
  latencyMs: number;
  normalizedQuery: string;
  ragUsed: boolean;
  response: string;
  runId: string;
  specializationHint?: string;
  tokenEstimate: number;
};

const AGENT_KEYWORDS: Record<Exclude<AgentRole, "orchestrator">, string[]> = {
  builder: ["build", "implement", "create", "ship", "deploy", "feature"],
  debugger: ["bug", "debug", "fix", "error", "failing", "timeout", "issue"],
  research: [
    "research",
    "investigate",
    "analyze",
    "compare",
    "evaluate",
    "find",
  ],
};

const SPECIALIZATION_KEYWORDS = [
  "automate",
  "workflow",
  "schedule",
  "pipeline",
  "recurring",
  "monitor",
  "sync",
];

function pickAgent(query: string): AgentRole {
  const normalized = query.toLowerCase();

  for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS) as Array<
    [Exclude<AgentRole, "orchestrator">, string[]]
  >) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return agent;
    }
  }

  return "orchestrator";
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function formatContextSnippet(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  if (clean.length <= 160) {
    return clean;
  }
  return `${clean.slice(0, 157)}...`;
}

function buildAgentResponse(input: {
  agent: AgentRole;
  query: string;
  context: Array<{ source?: string; title: string; content: string }>;
}): string {
  const contextSummary =
    input.context.length === 0
      ? "No indexed context matched this query yet."
      : input.context
          .map((item, idx) => {
            const prefix = item.source
              ? `${item.title} (${item.source})`
              : item.title;
            return `${idx + 1}. ${prefix}: ${formatContextSnippet(item.content)}`;
          })
          .join("\n");

  return [
    `Agent selected: ${input.agent}.`,
    "",
    `Request: ${input.query}`,
    "",
    "Retrieved context:",
    contextSummary,
    "",
    "Next action: continue with focused execution using the selected agent and retrieved context.",
  ].join("\n");
}

export async function runQueryPipeline(
  input: QueryPipelineInput,
): Promise<QueryPipelineOutput> {
  const startedAt = Date.now();
  const runId = `run_${Math.random().toString(36).slice(2, 10)}`;
  const agent = pickAgent(input.query);

  const retrieval = retrieveRelevantChunks({
    query: input.query,
    topK: input.topK,
  });

  const response = buildAgentResponse({
    agent,
    query: input.query,
    context: retrieval.items,
  });

  const latencyMs = Date.now() - startedAt;
  const tokenEstimate = estimateTokens(`${input.query}\n${response}`);
  const specializationHint = SPECIALIZATION_KEYWORDS.some((keyword) =>
    input.query.toLowerCase().includes(keyword),
  )
    ? "This looks workflow-specific. Consider creating a dedicated bot for this recurring task."
    : undefined;

  trackRun({
    agent,
    cacheHit: retrieval.cacheHit,
    contextCount: retrieval.items.length,
    latencyMs,
    normalizedQuery: retrieval.normalizedQuery,
    query: input.query,
    ragUsed: retrieval.items.length > 0,
    runId,
    timestamp: new Date().toISOString(),
    tokenEstimate,
    userId: input.userId,
  });

  return {
    agent,
    cacheHit: retrieval.cacheHit,
    contextCount: retrieval.items.length,
    context: retrieval.items.map((item) => ({
      id: item.id,
      score: Number(item.score.toFixed(4)),
      source: item.source,
      title: item.title,
    })),
    latencyMs,
    normalizedQuery: retrieval.normalizedQuery,
    ragUsed: retrieval.items.length > 0,
    response,
    runId,
    specializationHint,
    tokenEstimate,
  };
}
