import type { BillingTransition, StripeWebhookEvent } from "./types";
import { getStripePriceToPlanMap } from "./plan-mapping";

function planFromPriceId(
  priceId: string | undefined,
): BillingTransition["plan"] {
  if (!priceId) {
    return "premium";
  }

  const reverseMap = getStripePriceToPlanMap();
  const exact = reverseMap[priceId];

  if (exact) {
    return exact;
  }

  const normalized = priceId.toLowerCase();
  if (normalized.includes("business")) return "business";
  if (normalized.includes("pro")) return "pro";
  if (normalized.includes("premium")) return "premium";
  return "premium";
}

function extractMetadataUserId(
  object: Record<string, unknown>,
): string | undefined {
  const metadata = object.metadata as Record<string, unknown> | undefined;
  const fromMetadata = metadata?.user_id;

  if (typeof fromMetadata === "string" && fromMetadata.length > 0) {
    return fromMetadata;
  }

  const clientReferenceId = object.client_reference_id;
  if (typeof clientReferenceId === "string" && clientReferenceId.length > 0) {
    return clientReferenceId;
  }

  return undefined;
}

export function mapStripeEventToTransition(
  event: StripeWebhookEvent,
): BillingTransition | null {
  const object = event.data.object;
  const userId = extractMetadataUserId(object);
  const stripeCustomerId =
    typeof object.customer === "string" ? object.customer : undefined;

  if (event.type === "checkout.session.completed") {
    const plan = planFromPriceId(
      (object as { metadata?: { price_id?: string } }).metadata?.price_id,
    );

    return {
      accessStatus: "active",
      billingStatus: "checkout_completed",
      eventId: event.id,
      eventType: event.type,
      plan,
      stripeCustomerId,
      stripeSubscriptionId:
        typeof object.subscription === "string"
          ? object.subscription
          : undefined,
      userId,
    };
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const items = object.items as
      | { data?: Array<{ price?: { id?: string } }> }
      | undefined;
    const priceId = items?.data?.[0]?.price?.id;
    const status = typeof object.status === "string" ? object.status : "active";
    const trialEnd =
      typeof object.trial_end === "number"
        ? new Date(object.trial_end * 1000).toISOString()
        : undefined;

    return {
      accessStatus:
        status === "active" || status === "trialing" ? "active" : "inactive",
      billingStatus: status,
      eventId: event.id,
      eventType: event.type,
      plan: planFromPriceId(priceId),
      stripeCustomerId,
      stripeSubscriptionId:
        typeof object.id === "string" ? object.id : undefined,
      trialEndsAt: trialEnd,
      userId,
    };
  }

  if (event.type === "customer.subscription.deleted") {
    return {
      accessStatus: "expired",
      billingStatus: "canceled",
      eventId: event.id,
      eventType: event.type,
      plan: "free",
      stripeCustomerId,
      stripeSubscriptionId:
        typeof object.id === "string" ? object.id : undefined,
      userId,
    };
  }

  if (event.type === "invoice.payment_failed") {
    return {
      accessStatus: "inactive",
      billingStatus: "past_due",
      eventId: event.id,
      eventType: event.type,
      plan: "free",
      stripeCustomerId,
      stripeSubscriptionId:
        typeof object.subscription === "string"
          ? object.subscription
          : undefined,
      userId,
    };
  }

  return null;
}
