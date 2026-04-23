import { END, START, StateGraph } from "@/server/ai/langgraph-runtime";
import {
  generateChatCompletion,
  getProviderStatus,
} from "@/server/ai/provider";
import { buildTraceUrl, endTrace, startTrace } from "@/server/ai/tracing";
import { trackRun } from "@/server/ai/telemetry";
import { getRagStats, retrieveRelevantChunks } from "@/server/rag/store";

type AgentRole = "orchestrator" | "research" | "builder" | "debugger";

export type QueryPipelineInput = {
  query: string;
  role: "admin" | "service" | "user";
  topK?: number;
  userId: string;
};

export type QueryPipelineOutput = {
  agent: AgentRole;
  agentPath: string[];
  cacheHit: boolean;
  contextCount: number;
  context: Array<{
    id: string;
    score: number;
    source?: string;
    title: string;
  }>;
  estimatedCostUsd: number;
  latencyMs: number;
  llmMode: "openai" | "stub";
  llmModel: string;
  normalizedQuery: string;
  ragMode: "pgvector" | "memory";
  ragUsed: boolean;
  response: string;
  runId: string;
  specializationHint?: string;
  tokenEstimate: number;
  traceUrl?: string;
};

type PipelineState = {
  agent: AgentRole;
  agentPath: string[];
  cacheHit: boolean;
  context: Array<{
    id: string;
    score: number;
    source?: string;
    title: string;
    content: string;
  }>;
  llmMode: "openai" | "stub";
  llmModel: string;
  normalizedQuery: string;
  query: string;
  response: string;
  topK?: number;
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

function estimateCostUsd(tokenEstimate: number): number {
  return Number((tokenEstimate * 0.000002).toFixed(6));
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
  const graph = new StateGraph<PipelineState>()
    .addNode("normalize", (state) => ({
      ...state,
      agentPath: [...state.agentPath, "normalize"],
      normalizedQuery: state.query.replace(/\s+/g, " ").trim().toLowerCase(),
    }))
    .addNode("route", (state) => {
      const agent = pickAgent(state.normalizedQuery);
      return {
        ...state,
        agent,
        agentPath: [...state.agentPath, `route:${agent}`],
      };
    })
    .addNode("retrieve", async (state) => {
      const retrieval = await retrieveRelevantChunks({
        query: state.normalizedQuery,
        topK: state.topK,
      });

      return {
        ...state,
        agentPath: [...state.agentPath, "retrieve"],
        cacheHit: retrieval.cacheHit,
        context: retrieval.items,
        normalizedQuery: retrieval.normalizedQuery,
      };
    })
    .addNode("respond", async (state) => {
      const contextHint =
        state.context.length > 0
          ? state.context
              .map((item) => `${item.title}: ${item.content}`)
              .join("\n\n")
          : undefined;
      const completion = await generateChatCompletion(
        [{ role: "user", content: state.query }],
        contextHint,
      );
      // If the provider is in stub mode, enrich the response with agent/context metadata
      const response =
        completion.mode === "stub"
          ? buildAgentResponse({
              agent: state.agent,
              query: state.query,
              context: state.context,
            })
          : completion.text;
      return {
        ...state,
        agentPath: [...state.agentPath, "respond"],
        llmMode: completion.mode,
        llmModel: completion.model,
        response,
      };
    })
    .addEdge(START, "normalize")
    .addEdge("normalize", "route")
    .addEdge("route", "retrieve")
    .addEdge("retrieve", "respond")
    .addEdge("respond", END)
    .compile();

  await startTrace({
    runId,
    name: "axiom-query-pipeline",
    runType: "chain",
    inputs: { query: input.query, userId: input.userId },
    startedAt,
    tags: ["orchestrator"],
  });

  const finalState = await graph.invoke({
    agent: "orchestrator",
    agentPath: [],
    cacheHit: false,
    context: [],
    llmMode: "stub",
    llmModel: "stub",
    normalizedQuery: "",
    query: input.query,
    response: "",
    topK: input.topK,
  });

  const latencyMs = Date.now() - startedAt;
  const tokenEstimate = estimateTokens(
    `${input.query}\n${finalState.response}`,
  );
  const estimatedCostUsd = estimateCostUsd(tokenEstimate);
  const specializationHint = SPECIALIZATION_KEYWORDS.some((keyword) =>
    input.query.toLowerCase().includes(keyword),
  )
    ? "This looks workflow-specific. Consider creating a dedicated bot for this recurring task."
    : undefined;
  const traceUrl = buildTraceUrl(runId);
  const ragStats = getRagStats();
  const providerStatus = getProviderStatus();

  await endTrace({
    runId,
    outputs: {
      agent: finalState.agent,
      response: finalState.response,
      ragUsed: finalState.context.length > 0,
      latencyMs,
    },
    endedAt: Date.now(),
  });

  trackRun({
    agent: finalState.agent,
    agentPath: finalState.agentPath,
    cacheHit: finalState.cacheHit,
    contextCount: finalState.context.length,
    estimatedCostUsd,
    latencyMs,
    llmMode: finalState.llmMode,
    llmModel: finalState.llmModel,
    normalizedQuery: finalState.normalizedQuery,
    query: input.query,
    ragMode: ragStats.mode,
    ragUsed: finalState.context.length > 0,
    runId,
    timestamp: new Date().toISOString(),
    tokenEstimate,
    traceUrl,
    userId: input.userId,
  });

  return {
    agent: finalState.agent,
    agentPath: finalState.agentPath,
    cacheHit: finalState.cacheHit,
    contextCount: finalState.context.length,
    context: finalState.context.map((item) => ({
      id: item.id,
      score: Number(item.score.toFixed(4)),
      source: item.source,
      title: item.title,
    })),
    estimatedCostUsd,
    latencyMs,
    llmMode: finalState.llmMode,
    llmModel: finalState.llmModel,
    normalizedQuery: finalState.normalizedQuery,
    ragMode: ragStats.mode === "postgres" ? "pgvector" : "memory",
    ragUsed: finalState.context.length > 0,
    response: finalState.response,
    runId,
    specializationHint,
    tokenEstimate,
    traceUrl,
  };

  void providerStatus; // referenced to avoid unused-var lint error
}
