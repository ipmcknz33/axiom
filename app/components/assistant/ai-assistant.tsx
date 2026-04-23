"use client";

import { useEffect, useRef, useState } from "react";

type Role = "assistant" | "user";

type InspectorPayload = {
  agent: "orchestrator" | "research" | "builder" | "debugger";
  cacheHit: boolean;
  context: Array<{ id: string; score: number; source?: string; title: string }>;
  latencyMs: number;
  normalizedQuery: string;
  runId: string;
  specializationHint?: string;
  tokenEstimate: number;
};

type Message = {
  id: string;
  inspector?: InspectorPayload;
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

const SUGGESTIONS: Suggestion[] = [
  { label: "Summarize priorities", prompt: "Summarize my current priorities." },
  {
    label: "Automate daily reporting",
    prompt: "Automate my daily reporting workflow.",
  },
  {
    label: "Review approvals queue",
    prompt: "What is pending in the approvals queue?",
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
    return JSON.parse(raw) as Message[];
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
  const bottomRef = useRef<HTMLDivElement>(null);

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
          cacheHit: boolean;
          context: InspectorPayload["context"];
          latencyMs: number;
          normalizedQuery: string;
          runId: string;
          specializationHint?: string;
          tokenEstimate: number;
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
          cacheHit: payload.data.cacheHit,
          context: payload.data.context,
          latencyMs: payload.data.latencyMs,
          normalizedQuery: payload.data.normalizedQuery,
          runId: payload.data.runId,
          specializationHint: payload.data.specializationHint,
          tokenEstimate: payload.data.tokenEstimate,
        },
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
        {open ? "×" : "✦"}
      </button>

      {open && (
        <div
          className="assistant-panel"
          role="dialog"
          aria-label="AI Assistant"
        >
          <div className="assistant-panel__header">
            <span className="assistant-panel__title">Axiom Assistant</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="assistant-panel__clear"
                onClick={() => setShowInspector((v) => !v)}
                title="Toggle inspector"
              >
                Inspector
              </button>
              <button
                className="assistant-panel__clear"
                onClick={clearHistory}
                title="Clear history"
              >
                Clear
              </button>
            </div>
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
              {(() => {
                const latestAssistant = [...messages]
                  .reverse()
                  .find(
                    (message) =>
                      message.role === "assistant" && message.inspector,
                  );

                if (!latestAssistant?.inspector) {
                  return (
                    <p className="muted" style={{ margin: 0 }}>
                      Send a prompt to inspect agent, latency, tokens, cache,
                      and context.
                    </p>
                  );
                }

                const inspector = latestAssistant.inspector;
                return (
                  <>
                    <p className="muted" style={{ margin: 0 }}>
                      run {inspector.runId}
                    </p>
                    <p style={{ margin: "0.25rem 0 0" }}>
                      agent {inspector.agent} | latency {inspector.latencyMs}ms
                      | tokens {inspector.tokenEstimate} | cache{" "}
                      {inspector.cacheHit ? "hit" : "miss"}
                    </p>
                    <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                      normalized query: {inspector.normalizedQuery}
                    </p>
                    <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                      context: {inspector.context.length} chunks
                    </p>
                  </>
                );
              })()}
            </div>
          ) : null}

          <div className="assistant-panel__suggestions">
            {SUGGESTIONS.map((s) => (
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
              placeholder="Ask something…"
              disabled={thinking}
              autoFocus
            />
            <button
              className="assistant-send"
              onClick={() => sendMessage(input)}
              disabled={thinking || !input.trim()}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
