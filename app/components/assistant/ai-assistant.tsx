"use client";

import { useEffect, useRef, useState } from "react";

type Role = "assistant" | "user";

type InspectorPayload = {
  agent: "orchestrator" | "research" | "builder" | "debugger";
  agentPath: string[];
  cacheHit: boolean;
  context: Array<{ id: string; score: number; source?: string; title: string }>;
  contextCount: number;
  estimatedCostUsd: number;
  latencyMs: number;
  llmMode?: "openai" | "stub";
  llmModel?: string;
  normalizedQuery: string;
  ragMode?: "memory" | "postgres";
  ragUsed: boolean;
  runId: string;
  specializationHint?: string;
  tokenEstimate: number;
  traceUrl?: string;
};

type Message = {
  id: string;
  inspector?: InspectorPayload;
  prompt?: string;
  role: Role;
  text: string;
};

type Suggestion = {
  label: string;
  prompt: string;
};

const STORAGE_KEY = "axiom_assistant_messages";
const DEMO_HEADERS = {
  "Content-Type": "application/json",
  "x-axiom-role": "admin",
  "x-axiom-user-id": "11111111-1111-4111-8111-111111111111",
};

const ONBOARDING_SUGGESTIONS: Suggestion[] = [
  { label: "Create a marketing plan", prompt: "Create a marketing plan" },
  {
    label: "Explain how this system works",
    prompt: "Explain how this system works",
  },
  { label: "Build a workflow bot", prompt: "Build a workflow bot" },
];

const DEMO_ACTIONS: Suggestion[] = [
  {
    label: "Run Demo Workflow",
    prompt: "Run a demo workflow for weekly reporting and escalation.",
  },
  {
    label: "Test RAG Query",
    prompt: "What does the tattoo workflow recommend for handoff quality?",
  },
  {
    label: "Create Sample Bot",
    prompt: "Create a sample bot spec for recurring invoice reconciliation.",
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Message[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore quota errors
  }
}

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showInspector, setShowInspector] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState<boolean | null>(null);
  const [seedCount, setSeedCount] = useState(0);
  const [seedBusy, setSeedBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.inspector);

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    const shouldAddGreeting = loadMessages().length === 0;

    const bootstrap = async () => {
      try {
        const response = await fetch("/api/v1/rag/seed", {
          method: "GET",
          headers: DEMO_HEADERS,
        });

        const payload = (await response.json()) as {
          data?: {
            documentCount: number;
            isSeeded: boolean;
          };
          error?: { message?: string };
        };

        if (!response.ok || !payload.data) {
          throw new Error(
            payload.error?.message ?? "Unable to initialize RAG seed.",
          );
        }

        setSeeded(payload.data.isSeeded);
        setSeedCount(payload.data.documentCount);

        if (shouldAddGreeting) {
          setMessages([
            {
              id: uid(),
              role: "assistant",
              text: "I can answer questions, create bots, and run workflows. Start with a one-click demo action or ask me anything.",
            },
          ]);
        }
      } catch {
        setSeeded(false);
      }
    };

    bootstrap();
  }, []);

  async function reseed() {
    if (seedBusy) return;
    setSeedBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/rag/seed", {
        method: "POST",
        headers: DEMO_HEADERS,
      });

      const payload = (await response.json()) as {
        data?: {
          documentCount: number;
          isSeeded: boolean;
        };
        error?: { message?: string };
      };

      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error?.message ?? "Unable to reseed documents.",
        );
      }

      setSeeded(payload.data.isSeeded);
      setSeedCount(payload.data.documentCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reseed documents.",
      );
    } finally {
      setSeedBusy(false);
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMsg: Message = { id: uid(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setThinking(true);

    try {
      const response = await fetch("/api/v1/ai/query", {
        method: "POST",
        headers: DEMO_HEADERS,
        body: JSON.stringify({ query: trimmed }),
      });

      const payload = (await response.json()) as {
        data?: {
          response: string;
          agent: InspectorPayload["agent"];
          agentPath: string[];
          cacheHit: boolean;
          context: InspectorPayload["context"];
          contextCount: number;
          estimatedCostUsd: number;
          latencyMs: number;
          normalizedQuery: string;
          ragUsed: boolean;
          runId: string;
          specializationHint?: string;
          tokenEstimate: number;
          traceUrl?: string;
        };
        error?: { message?: string };
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to run AI query.");
      }

      const responseText = payload.data.specializationHint
        ? `${payload.data.response}\n\n${payload.data.specializationHint}`
        : payload.data.response;

      const assistantMsg: Message = {
        id: uid(),
        inspector: {
          agent: payload.data.agent,
          agentPath: payload.data.agentPath,
          cacheHit: payload.data.cacheHit,
          context: payload.data.context,
          contextCount: payload.data.contextCount,
          estimatedCostUsd: payload.data.estimatedCostUsd,
          latencyMs: payload.data.latencyMs,
          normalizedQuery: payload.data.normalizedQuery,
          ragUsed: payload.data.ragUsed,
          runId: payload.data.runId,
          specializationHint: payload.data.specializationHint,
          tokenEstimate: payload.data.tokenEstimate,
          traceUrl: payload.data.traceUrl,
        },
        prompt: trimmed,
        role: "assistant",
        text: responseText,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run AI query.");
    } finally {
      setThinking(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      sendMessage(input);
    }
  }

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <>
      <button
        className={`assistant-bubble${open ? " assistant-bubble--open" : ""}`}
        aria-label={open ? "Close assistant" : "Open assistant"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "x" : "*"}
      </button>

      {open && (
        <div
          className="assistant-panel"
          role="dialog"
          aria-label="AI Assistant"
        >
          <div className="assistant-panel__header">
            <div className="assistant-panel__title-wrap">
              <span className="assistant-panel__title">Axiom Assistant</span>
              <span
                className={`assistant-seed-pill${seeded ? " assistant-seed-pill--ready" : ""}`}
              >
                {seeded ? `Seeded (${seedCount})` : "Seed pending"}
              </span>
            </div>
            <div className="assistant-tools-row">
              <button
                className="assistant-tool-btn"
                onClick={() => setShowInspector((v) => !v)}
                title="Toggle inspector"
              >
                Inspector
              </button>
              <button
                className="assistant-tool-btn"
                onClick={reseed}
                disabled={seedBusy}
              >
                {seedBusy ? "Seeding..." : "Re-seed"}
              </button>
              <button
                className="assistant-tool-btn"
                onClick={clearHistory}
                title="Clear history"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="assistant-action-row">
            {DEMO_ACTIONS.map((action) => (
              <button
                key={action.label}
                className="assistant-chip"
                onClick={() => sendMessage(action.prompt)}
                disabled={thinking}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="assistant-panel__messages">
            {messages.length === 0 && (
              <p className="assistant-panel__empty">
                Ask anything about your workflows, agents, or approvals.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "assistant"
                    ? "assistant-msg assistant-msg--bot"
                    : "assistant-msg assistant-msg--user"
                }
              >
                {m.text}
                {m.inspector ? (
                  <div className="assistant-badges">
                    <span className="assistant-badge">{m.inspector.agent}</span>
                    <span className="assistant-badge">
                      {m.inspector.ragUsed ? "RAG" : "No RAG"}
                    </span>
                    <span className="assistant-badge">
                      {m.inspector.cacheHit ? "Cache hit" : "Cache miss"}
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
            {thinking && (
              <div className="assistant-msg assistant-msg--bot assistant-msg--thinking">
                <span className="assistant-typing">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
            {error ? <p className="upgrade-error">{error}</p> : null}
            <div ref={bottomRef} />
          </div>

          {showInspector ? (
            <div className="assistant-inspector">
              {!latestAssistant?.inspector ? (
                <p className="muted" style={{ margin: 0 }}>
                  Send a prompt to inspect agent, latency, tokens, cache, and
                  context docs.
                </p>
              ) : (
                <>
                  <p className="muted" style={{ margin: 0 }}>
                    run {latestAssistant.inspector.runId}
                  </p>
                  <p style={{ margin: "0.25rem 0 0" }}>
                    agent {latestAssistant.inspector.agent} | latency{" "}
                    {latestAssistant.inspector.latencyMs}ms | tokens{" "}
                    {latestAssistant.inspector.tokenEstimate}
                  </p>
                  <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                    est cost $
                    {latestAssistant.inspector.estimatedCostUsd.toFixed(6)}
                  </p>
                  <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                    cache {latestAssistant.inspector.cacheHit ? "hit" : "miss"}{" "}
                    | rag {latestAssistant.inspector.ragUsed ? "used" : "none"}
                    {latestAssistant.inspector.ragMode
                      ? ` (${latestAssistant.inspector.ragMode})`
                      : ""}
                  </p>
                  {latestAssistant.inspector.llmMode ? (
                    <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                      llm: {latestAssistant.inspector.llmMode}
                      {latestAssistant.inspector.llmModel
                        ? ` — ${latestAssistant.inspector.llmModel}`
                        : ""}
                    </p>
                  ) : null}
                  <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                    path: {latestAssistant.inspector.agentPath.join(" -> ")}
                  </p>
                  <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                    prompt: {latestAssistant.prompt}
                  </p>
                  <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                    normalized query:{" "}
                    {latestAssistant.inspector.normalizedQuery}
                  </p>
                  <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                    context docs: {latestAssistant.inspector.contextCount}
                  </p>
                  {latestAssistant.inspector.traceUrl ? (
                    <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                      trace: {latestAssistant.inspector.traceUrl}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          <div className="assistant-panel__suggestions">
            {ONBOARDING_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                className="assistant-chip"
                onClick={() => sendMessage(s.prompt)}
                disabled={thinking}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="assistant-panel__input-row">
            <input
              className="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
              disabled={thinking}
              autoFocus
            />
            <button
              className="assistant-send"
              onClick={() => sendMessage(input)}
              disabled={thinking || !input.trim()}
              aria-label="Send"
            >
              ^
            </button>
          </div>
        </div>
      )}
    </>
  );
}
