import { getStripeServerEnv } from "@/lib/stripe/env";
import {
  STRIPE_METADATA_PLAN,
  STRIPE_METADATA_USER_ID,
  resolvePriceIdForPlan,
  resolvePlanForPriceId,
  mapStripeSubscriptionStatus,
} from "@/server/billing/plans";
import type { CheckoutPlan } from "@/server/billing/stripe/plan-mapping";

export type BillingSnapshot = {
  billingState:
    | "active"
    | "trial"
    | "processing"
    | "past_due"
    | "canceled"
    | "expired";
  currentPeriodEnd?: string;
  plan: CheckoutPlan | "free";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

function authHeader() {
  const env = getStripeServerEnv();
  return {
    Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

export async function createStripeCheckoutSession(input: {
  baseUrl: string;
  existingCustomerId?: string;
  plan: CheckoutPlan;
  userId: string;
}) {
  const priceId = resolvePriceIdForPlan(input.plan);

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", `${input.baseUrl}/app?billing=success`);
  form.set("cancel_url", `${input.baseUrl}/app?billing=canceled`);
  form.set(`metadata[${STRIPE_METADATA_USER_ID}]`, input.userId);
  form.set(`metadata[${STRIPE_METADATA_PLAN}]`, input.plan);
  form.set("metadata[price_id]", priceId);
  form.set(
    `subscription_data[metadata][${STRIPE_METADATA_USER_ID}]`,
    input.userId,
  );
  form.set(`subscription_data[metadata][${STRIPE_METADATA_PLAN}]`, input.plan);

  if (input.existingCustomerId) {
    form.set("customer", input.existingCustomerId);
  } else {
    form.set("customer_creation", "always");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    body: form.toString(),
    headers: authHeader(),
    method: "POST",
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    id?: string;
    url?: string;
  };

  if (!response.ok || !data.id || !data.url) {
    throw new Error(
      data.error?.message ?? "Failed to create Stripe checkout session.",
    );
  }

  return {
    checkoutSessionId: data.id,
    checkoutUrl: data.url,
    priceId,
  };
}

export async function fetchStripeBillingSnapshot(input: {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}): Promise<BillingSnapshot> {
  if (!input.stripeSubscriptionId) {
    return {
      billingState: "processing",
      plan: "free",
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: undefined,
    };
  }

  const subResponse = await fetch(
    `https://api.stripe.com/v1/subscriptions/${input.stripeSubscriptionId}`,
    {
      headers: authHeader(),
      method: "GET",
    },
  );

  const subPayload = (await subResponse.json()) as {
    current_period_end?: number;
    error?: { message?: string };
    id?: string;
    items?: { data?: Array<{ price?: { id?: string } }> };
    status?: string;
  };

  if (!subResponse.ok) {
    throw new Error(
      subPayload.error?.message ?? "Unable to fetch Stripe subscription.",
    );
  }

  const priceId = subPayload.items?.data?.[0]?.price?.id;
  const plan = resolvePlanForPriceId(priceId) ?? "free";

  return {
    billingState: mapStripeSubscriptionStatus(subPayload.status),
    currentPeriodEnd:
      typeof subPayload.current_period_end === "number"
        ? new Date(subPayload.current_period_end * 1000).toISOString()
        : undefined,
    plan,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: subPayload.id,
  };
}
