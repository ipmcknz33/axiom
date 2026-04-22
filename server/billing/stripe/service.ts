import type { StripeWebhookEvent } from "./types";
import { processStripeWebhookEvent } from "./processor";
import {
  applyBillingTransition,
  beginBillingWebhookEvent,
  updateBillingWebhookEventStatus,
} from "../repository";

export async function handleStripeWebhook(event: StripeWebhookEvent) {
  return processStripeWebhookEvent(event, {
    applyTransition: applyBillingTransition,
    beginWebhookEvent: beginBillingWebhookEvent,
    markWebhookEvent: updateBillingWebhookEventStatus,
  });
}
