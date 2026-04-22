import { getStripeServerEnv } from "@/lib/stripe/env";
import { getAccountEntitlement } from "@/server/entitlements/repository";
import type { CheckoutPlan } from "@/server/billing/stripe/plan-mapping";
import {
  createStripeCheckoutSession,
  fetchStripeBillingSnapshot,
} from "@/server/billing/stripe";

export async function createCheckoutSessionForUser(input: {
  plan: CheckoutPlan;
  userId: string;
}) {
  const entitlement = await getAccountEntitlement(input.userId);
  const env = getStripeServerEnv();

  return createStripeCheckoutSession({
    baseUrl: env.NEXT_PUBLIC_SITE_URL,
    existingCustomerId: entitlement?.stripe_customer_id ?? undefined,
    plan: input.plan,
    userId: input.userId,
  });
}

export async function getBillingSnapshotForUser(userId: string) {
  const entitlement = await getAccountEntitlement(userId);

  return fetchStripeBillingSnapshot({
    stripeCustomerId: entitlement?.stripe_customer_id ?? undefined,
    stripeSubscriptionId: entitlement?.stripe_subscription_id ?? undefined,
  });
}
