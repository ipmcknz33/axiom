import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RagDocumentInput = {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  source?: string;
};

export type RagChunk = {
  id: string;
  title: string;
  source?: string;
  content: string;
  embedding: number[];
  ingestedAt: string;
};

export type RagRetrievalItem = {
  id: string;
  title: string;
  source?: string;
  content: string;
  metadata?: Record<string, unknown>;
  score: number;
};

export type RagRetrievalResult = {
  cacheHit: boolean;
  items: RagRetrievalItem[];
  normalizedQuery: string;
};

export type RagStats = {
  cacheEntries: number;
  documents: number;
  isSeeded: boolean;
  chunks: number;
  mode: "memory" | "postgres";
};

export type SeedStatus = {
  documentCount: number;
  isSeeded: boolean;
  mode: "memory" | "postgres";
};

type RagQueryCacheEntry = {
  items: RagRetrievalItem[];
  normalizedQuery: string;
  storedAt: number;
};

type RagRuntimeState = {
  chunks: RagChunk[];
  queryCache: Map<string, RagQueryCacheEntry>;
  mode: "memory" | "postgres";
  seeded: boolean;
};

const EMBEDDING_DIM = 24;
const MAX_CACHE_ENTRIES = 200;
const DEFAULT_TOP_K = 4;

const DEMO_SEED_DOCUMENTS: RagDocumentInput[] = [
  {
    id: "seed-marketing-strategy",
    title: "Marketing Strategy Guide",
    source: "demo://marketing",
    content:
      "For a high-impact marketing plan, start with audience segmentation, map pain points, define a message hierarchy, and test one core offer across channels. Combine weekly content themes with measurable conversion goals.",
  },
  {
    id: "seed-frontend-system-design",
    title: "Frontend System Design Notes",
    source: "demo://frontend",
    content:
      "A resilient frontend architecture uses route-level boundaries, typed contracts between UI and APIs, optimistic states with deterministic rollback, and observability hooks for latency and error budget tracking.",
  },
  {
    id: "seed-tattoo-workflow",
    title: "Tattoo Workflow Operations",
    source: "demo://tattoo",
    content:
      "Tattoo studio workflow runs from intake to design approval, stencil prep, session execution, aftercare handoff, and follow-up scheduling. Consistency improves when checklist-based handoffs are used between each step.",
  },
  {
    id: "seed-ai-orchestration",
    title: "AI Agent Orchestration Reference",
    source: "demo://orchestration",
    content:
      "Agent orchestration should route intent to specialized agents, enrich prompts with retrieved context, enforce approval gates for high-risk actions, and log each run with latency, token estimate, and cache status.",
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __axiomRagState: RagRuntimeState | undefined;
}

function getRuntimeState(): RagRuntimeState {
  if (!globalThis.__axiomRagState) {
    globalThis.__axiomRagState = {
      chunks: [],
      queryCache: new Map<string, RagQueryCacheEntry>(),
      mode: "memory",
      seeded: false,
    };
  }

  return globalThis.__axiomRagState;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeVector(values: number[]): number[] {
  const magnitude = Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0),
  );
  if (magnitude === 0) {
    return values;
  }

  return values.map((value) => value / magnitude);
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return Math.abs(hash >>> 0);
}

function buildEmbedding(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return vector;
  }

  for (const token of tokens) {
    const hashed = hashToken(token);
    const idx = hashed % EMBEDDING_DIM;
    vector[idx] += 1;
  }

  return normalizeVector(vector);
}

function cosineSimilarity(left: number[], right: number[]): number {
  let dot = 0;
  for (let i = 0; i < EMBEDDING_DIM; i += 1) {
    dot += (left[i] ?? 0) * (right[i] ?? 0);
  }

  return dot;
}

function compactCache(cache: Map<string, RagQueryCacheEntry>) {
  if (cache.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  const orderedEntries = [...cache.entries()].sort(
    (a, b) => a[1].storedAt - b[1].storedAt,
  );
  const toRemove = orderedEntries.slice(0, cache.size - MAX_CACHE_ENTRIES);
  for (const [key] of toRemove) {
    cache.delete(key);
  }
}

function dedupeAndValidateDocuments(
  documents: RagDocumentInput[],
): RagDocumentInput[] {
  const seenIds = new Set<string>();
  const output: RagDocumentInput[] = [];

  for (const doc of documents) {
    if (!doc.id || !doc.title || !doc.content) {
      continue;
    }

    if (seenIds.has(doc.id)) {
      continue;
    }

    seenIds.add(doc.id);
    output.push({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata,
      source: doc.source,
    });
  }

  return output;
}

function upsertMemoryDocuments(
  documents: RagDocumentInput[],
  state: RagRuntimeState,
) {
  const now = new Date().toISOString();

  for (const doc of documents) {
    const chunk: RagChunk = {
      id: doc.id,
      title: doc.title,
      source: doc.source,
      content: doc.content,
      embedding: buildEmbedding(doc.content),
      ingestedAt: now,
    };

    const existingIndex = state.chunks.findIndex((item) => item.id === doc.id);
    if (existingIndex >= 0) {
      state.chunks[existingIndex] = chunk;
    } else {
      state.chunks.push(chunk);
    }
  }
}

function toVectorLiteral(values: number[]): string {
  return `[${values.map((value) => value.toFixed(8)).join(",")}]`;
}

async function ingestToPostgres(
  documents: RagDocumentInput[],
): Promise<boolean> {
  try {
    const supabase = createSupabaseServerClient();
    const rows = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      source: doc.source ?? null,
      metadata: doc.metadata ?? {},
      embedding: toVectorLiteral(buildEmbedding(doc.content)),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await (supabase.from("rag_documents") as any).upsert(
      rows,
      {
        onConflict: "id",
      },
    );

    return !error;
  } catch {
    return false;
  }
}

export async function ingestDocuments(documents: RagDocumentInput[]) {
  const state = getRuntimeState();
  const validDocuments = dedupeAndValidateDocuments(documents);

  const postgresOk = await ingestToPostgres(validDocuments);
  state.mode = postgresOk ? "postgres" : "memory";

  upsertMemoryDocuments(validDocuments, state);

  if (validDocuments.length > 0) {
    state.queryCache.clear();
  }

  return {
    ingested: validDocuments.length,
    mode: state.mode,
    totalChunks: state.chunks.length,
  };
}

function setSeedCorpus(state: RagRuntimeState): SeedStatus {
  state.chunks = [];
  state.queryCache.clear();
  upsertMemoryDocuments(DEMO_SEED_DOCUMENTS, state);

  state.seeded = true;

  return {
    documentCount: state.chunks.length,
    isSeeded: state.seeded,
    mode: state.mode,
  };
}

export function isSeeded(): boolean {
  const state = getRuntimeState();
  return state.seeded;
}

export async function ensureSeeded(): Promise<SeedStatus> {
  const state = getRuntimeState();
  if (state.seeded && state.chunks.length > 0) {
    return {
      documentCount: state.chunks.length,
      isSeeded: true,
      mode: state.mode,
    };
  }

  const seedState = setSeedCorpus(state);
  const postgresOk = await ingestToPostgres(DEMO_SEED_DOCUMENTS);
  if (postgresOk) {
    state.mode = "postgres";
    seedState.mode = "postgres";
  }

  return seedState;
}

export async function reseedDemoDocuments(): Promise<SeedStatus> {
  const state = getRuntimeState();
  const seedState = setSeedCorpus(state);
  const postgresOk = await ingestToPostgres(DEMO_SEED_DOCUMENTS);
  if (postgresOk) {
    state.mode = "postgres";
    seedState.mode = "postgres";
  }

  return seedState;
}

async function retrieveFromPostgres(input: {
  query: string;
  topK: number;
  metadataFilter?: Record<string, unknown>;
}): Promise<RagRetrievalItem[] | null> {
  try {
    const supabase = createSupabaseServerClient();
    const queryEmbedding = buildEmbedding(input.query);
    const { data, error } = await (supabase.rpc("match_rag_documents", {
      query_embedding: toVectorLiteral(queryEmbedding),
      match_count: input.topK,
      metadata_filter: input.metadataFilter ?? {},
    }) as any);

    if (error || !Array.isArray(data)) {
      return null;
    }

    return data.map((row: any) => ({
      id: String(row.id),
      title: String(row.title),
      source: row.source ?? undefined,
      content: String(row.content),
      metadata: row.metadata ?? undefined,
      score: Number(row.score ?? 0),
    }));
  } catch {
    return null;
  }
}

function retrieveFromMemory(input: {
  query: string;
  topK: number;
}): RagRetrievalItem[] {
  const state = getRuntimeState();
  const queryEmbedding = buildEmbedding(input.query);
  return state.chunks
    .map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      source: chunk.source,
      content: chunk.content,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, input.topK)
    .filter((item) => item.score > 0);
}

export async function retrieveRelevantChunks(input: {
  query: string;
  metadataFilter?: Record<string, unknown>;
  topK?: number;
}): Promise<RagRetrievalResult> {
  await ensureSeeded();
  const state = getRuntimeState();
  const normalizedQuery = normalizeQuery(input.query);
  const topK = Math.max(1, Math.min(input.topK ?? DEFAULT_TOP_K, 8));

  const cached = state.queryCache.get(normalizedQuery);
  if (cached) {
    return {
      cacheHit: true,
      items: cached.items,
      normalizedQuery,
    };
  }

  const postgresItems = await retrieveFromPostgres({
    query: normalizedQuery,
    topK,
    metadataFilter: input.metadataFilter,
  });

  const ranked =
    postgresItems ?? retrieveFromMemory({ query: normalizedQuery, topK });
  state.mode = postgresItems ? "postgres" : "memory";

  const entry: RagQueryCacheEntry = {
    items: ranked,
    normalizedQuery,
    storedAt: Date.now(),
  };
  state.queryCache.set(normalizedQuery, entry);
  compactCache(state.queryCache);

  return {
    cacheHit: false,
    items: ranked,
    normalizedQuery,
  };
}

export function getRagStats(): RagStats {
  const state = getRuntimeState();
  return {
    cacheEntries: state.queryCache.size,
    documents: state.chunks.length,
    isSeeded: state.seeded,
    chunks: state.chunks.length,
    mode: state.mode,
  };
}
