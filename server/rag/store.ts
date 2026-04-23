export type RagDocumentInput = {
  id: string;
  title: string;
  content: string;
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
  chunks: number;
};

type RagQueryCacheEntry = {
  items: RagRetrievalItem[];
  normalizedQuery: string;
  storedAt: number;
};

type RagRuntimeState = {
  chunks: RagChunk[];
  queryCache: Map<string, RagQueryCacheEntry>;
};

const EMBEDDING_DIM = 24;
const MAX_CACHE_ENTRIES = 200;

declare global {
  // eslint-disable-next-line no-var
  var __axiomRagState: RagRuntimeState | undefined;
}

function getRuntimeState(): RagRuntimeState {
  if (!globalThis.__axiomRagState) {
    globalThis.__axiomRagState = {
      chunks: [],
      queryCache: new Map<string, RagQueryCacheEntry>(),
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
      source: doc.source,
    });
  }

  return output;
}

export function ingestDocuments(documents: RagDocumentInput[]) {
  const state = getRuntimeState();
  const validDocuments = dedupeAndValidateDocuments(documents);
  const now = new Date().toISOString();

  for (const doc of validDocuments) {
    state.chunks.push({
      id: doc.id,
      title: doc.title,
      source: doc.source,
      content: doc.content,
      embedding: buildEmbedding(doc.content),
      ingestedAt: now,
    });
  }

  if (validDocuments.length > 0) {
    state.queryCache.clear();
  }

  return {
    ingested: validDocuments.length,
    totalChunks: state.chunks.length,
  };
}

export function retrieveRelevantChunks(input: {
  query: string;
  topK?: number;
}): RagRetrievalResult {
  const state = getRuntimeState();
  const normalizedQuery = normalizeQuery(input.query);
  const topK = Math.max(1, Math.min(input.topK ?? 4, 8));

  const cached = state.queryCache.get(normalizedQuery);
  if (cached) {
    return {
      cacheHit: true,
      items: cached.items,
      normalizedQuery,
    };
  }

  const queryEmbedding = buildEmbedding(normalizedQuery);
  const ranked = state.chunks
    .map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      source: chunk.source,
      content: chunk.content,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((item) => item.score > 0);

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
    chunks: state.chunks.length,
  };
}
