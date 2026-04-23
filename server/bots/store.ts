export type BotCapability = "chat" | "workflow" | "research" | "monitoring";

export type BotRequest = {
  capabilities: BotCapability[];
  confirmed: boolean;
  createdAt: string;
  id: string;
  intent: string;
  name: string;
  requestedBy: string;
  status: "queued" | "processing" | "ready";
};

type BotRuntimeState = {
  requests: BotRequest[];
};

const MAX_REQUESTS = 50;

declare global {
  // eslint-disable-next-line no-var
  var __axiomBotState: BotRuntimeState | undefined;
}

function getRuntimeState(): BotRuntimeState {
  if (!globalThis.__axiomBotState) {
    globalThis.__axiomBotState = { requests: [] };
  }

  return globalThis.__axiomBotState;
}

export function queueBotRequest(input: {
  capabilities: BotCapability[];
  intent: string;
  name: string;
  requestedBy: string;
}): BotRequest {
  const state = getRuntimeState();

  const request: BotRequest = {
    capabilities: input.capabilities,
    confirmed: true,
    createdAt: new Date().toISOString(),
    id: `bot_${Math.random().toString(36).slice(2, 10)}`,
    intent: input.intent,
    name: input.name,
    requestedBy: input.requestedBy,
    status: "queued",
  };

  state.requests.unshift(request);
  if (state.requests.length > MAX_REQUESTS) {
    state.requests.length = MAX_REQUESTS;
  }

  return request;
}

export function getRecentBotRequests(limit = 10): BotRequest[] {
  const state = getRuntimeState();
  return state.requests.slice(0, Math.max(1, limit));
}
