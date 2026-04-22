import type {
  BillingProcessorOutcome,
  BillingTransition,
  StripeWebhookEvent,
} from "./types";
import { mapStripeEventToTransition } from "./mapping";

export type BillingWebhookStore = {
  applyTransition: (transition: BillingTransition) => Promise<void>;
  beginWebhookEvent: (input: {
    eventId: string;
    eventType: string;
    payload: unknown;
  }) => Promise<{ deduped: boolean }>;
  markWebhookEvent: (input: {
    error?: string;
    eventId: string;
    status: "failed" | "ignored" | "processed";
  }) => Promise<void>;
};

export async function processStripeWebhookEvent(
  event: StripeWebhookEvent,
  store: BillingWebhookStore,
): Promise<BillingProcessorOutcome> {
  const start = await store.beginWebhookEvent({
    eventId: event.id,
    eventType: event.type,
    payload: event,
  });

  if (start.deduped) {
    return { deduped: true, status: "processed" };
  }

  const transition = mapStripeEventToTransition(event);

  if (!transition) {
    await store.markWebhookEvent({
      eventId: event.id,
      status: "ignored",
    });

    return {
      deduped: false,
      reason: "unsupported_event_type",
      status: "ignored",
    };
  }

  try {
    await store.applyTransition(transition);
    await store.markWebhookEvent({
      eventId: event.id,
      status: "processed",
    });
    return { deduped: false, status: "processed" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    await store.markWebhookEvent({
      error: message,
      eventId: event.id,
      status: "failed",
    });

    return {
      deduped: false,
      reason: message,
      status: "failed",
    };
  }
}
