import { fail, failFromError, ok } from "@/lib/api/response";
import {
  getRecentBotRequests,
  queueBotRequest,
  type BotCapability,
} from "@/server/bots/store";
import { getAuthContext } from "@/server/security/auth";

const VALID_CAPABILITIES: readonly BotCapability[] = [
  "chat",
  "workflow",
  "research",
  "monitoring",
];

type BotPayload = {
  capabilities?: string[];
  intent?: string;
  name?: string;
};

export async function GET(request: Request) {
  try {
    const auth = getAuthContext(request.headers);
    if (!auth.success) {
      return fail(auth.error, 401, "unauthenticated");
    }

    return ok({
      requests: getRecentBotRequests(10),
      viewer: { role: auth.data.role, userId: auth.data.userId },
    });
  } catch (error) {
    return failFromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = getAuthContext(request.headers);
    if (!auth.success) {
      return fail(auth.error, 401, "unauthenticated");
    }

    const payload = (await request
      .json()
      .catch(() => null)) as BotPayload | null;

    const name = payload?.name?.trim();
    const intent = payload?.intent?.trim();
    const rawCaps = payload?.capabilities ?? [];

    if (!name) {
      return fail("name is required.", 400, "invalid_name");
    }

    if (!intent) {
      return fail("intent is required.", 400, "invalid_intent");
    }

    if (!Array.isArray(rawCaps) || rawCaps.length === 0) {
      return fail(
        "at least one capability is required.",
        400,
        "invalid_capabilities",
      );
    }

    const validCaps = rawCaps.filter((c): c is BotCapability =>
      (VALID_CAPABILITIES as readonly string[]).includes(c),
    );

    if (validCaps.length === 0) {
      return fail(
        "no valid capabilities provided.",
        400,
        "invalid_capabilities",
      );
    }

    const bot = queueBotRequest({
      capabilities: validCaps,
      intent,
      name,
      requestedBy: auth.data.userId,
    });

    return ok({ bot });
  } catch (error) {
    return failFromError(error);
  }
}
