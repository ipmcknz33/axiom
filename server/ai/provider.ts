/**
 * server/ai/provider.ts
 *
 * AI provider abstraction: live OpenAI chat + embeddings, with deterministic
 * fallback when OPENAI_API_KEY is absent or the API call fails.
 *
 * Never call this from client components — it reads server-only config.
 */
import { getAiConfig } from "@/lib/ai-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionResult = {
  text: string;
  model: string;
  mode: "openai" | "stub";
  promptTokens: number;
  completionTokens: number;
};

export type EmbeddingResult = {
  embedding: number[];
  mode: "openai" | "deterministic";
};

// ---------------------------------------------------------------------------
// Deterministic fallback — keeps the demo fully functional without a key
// ---------------------------------------------------------------------------

const EMBEDDING_DIM = 24;

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    // FNV-1a 32-bit
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function deterministicEmbedding(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  if (tokens.length === 0) return vector;

  for (const token of tokens) {
    const idx = hashToken(token) % EMBEDDING_DIM;
    vector[idx] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  return magnitude === 0 ? vector : vector.map((v) => v / magnitude);
}

function deterministicChatResponse(messages: ChatMessage[]): string {
  const last = messages.findLast((m) => m.role === "user");
  const query = last?.content ?? "request";

  return [
    "Axiom agent response (stub mode — add OPENAI_API_KEY for live responses).",
    "",
    `Understood: ${query}`,
    "",
    "Next action: continue with focused execution using the selected agent and retrieved context.",
  ].join("\n");
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

// ---------------------------------------------------------------------------
// Live OpenAI helpers — uses native fetch to avoid bundling the full SDK
// ---------------------------------------------------------------------------

type OpenAiChatResponse = {
  choices: Array<{
    message: { content: string | null };
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
};

type OpenAiEmbeddingResponse = {
  data: Array<{ embedding: number[] }>;
};

async function liveChat(
  messages: ChatMessage[],
  apiKey: string,
  model: string,
): Promise<ChatCompletionResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 512,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI chat API error ${response.status}: ${response.statusText}`,
    );
  }

  const body = (await response.json()) as OpenAiChatResponse;
  const text = body.choices[0]?.message?.content ?? "";

  return {
    text,
    model: body.model,
    mode: "openai",
    promptTokens:
      body.usage?.prompt_tokens ??
      estimateTokens(messages.map((m) => m.content).join(" ")),
    completionTokens: body.usage?.completion_tokens ?? estimateTokens(text),
  };
}

async function liveEmbedding(
  text: string,
  apiKey: string,
  model: string,
): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: text }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI embeddings API error ${response.status}: ${response.statusText}`,
    );
  }

  const body = (await response.json()) as OpenAiEmbeddingResponse;
  const embedding = body.data[0]?.embedding;
  if (!embedding) throw new Error("OpenAI embeddings: empty response");

  return embedding;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a chat completion. Falls back to deterministic stub on error
 * or when no API key is configured.
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  contextHint?: string,
): Promise<ChatCompletionResult> {
  const config = getAiConfig();

  if (config.llm.isLive && config.llm.apiKey) {
    try {
      // Prepend a system message if context is available
      const fullMessages: ChatMessage[] = contextHint
        ? [
            {
              role: "system",
              content: `You are Axiom, a focused AI work assistant. Use this context to answer:\n\n${contextHint}`,
            },
            ...messages,
          ]
        : messages;

      return await liveChat(
        fullMessages,
        config.llm.apiKey,
        config.llm.chatModel,
      );
    } catch {
      // Fall through to stub on any API failure
    }
  }

  const stubText = deterministicChatResponse(messages);
  return {
    text: stubText,
    model: "stub",
    mode: "stub",
    promptTokens: estimateTokens(messages.map((m) => m.content).join(" ")),
    completionTokens: estimateTokens(stubText),
  };
}

/**
 * Generates an embedding vector. Falls back to deterministic 24-dim hash
 * embedding on error or when no API key is configured.
 */
export async function generateEmbedding(
  text: string,
): Promise<EmbeddingResult> {
  const config = getAiConfig();

  if (config.llm.isLive && config.llm.apiKey) {
    try {
      const embedding = await liveEmbedding(
        text,
        config.llm.apiKey,
        config.llm.embeddingsModel,
      );
      return { embedding, mode: "openai" };
    } catch {
      // Fall through to deterministic fallback
    }
  }

  return {
    embedding: deterministicEmbedding(text),
    mode: "deterministic",
  };
}

/** Returns the current provider mode without making any API calls. */
export function getProviderStatus() {
  const config = getAiConfig();
  return {
    llm: config.llm.mode,
    embeddings: config.embeddings.mode,
    model: config.llm.chatModel,
    embeddingsModel: config.llm.embeddingsModel,
    isLive: config.llm.isLive,
  };
}
