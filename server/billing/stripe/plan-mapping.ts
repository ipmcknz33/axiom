import { getStripeServerEnv } from "../../../lib/stripe/env";

export type CheckoutPlan = "premium" | "pro" | "business";

export function getStripePriceIdForPlan(plan: CheckoutPlan): string {
  const env = getStripeServerEnv();

  if (plan === "premium") {
    if (!env.STRIPE_PRICE_PREMIUM) {
      throw new Error("Missing STRIPE_PRICE_PREMIUM for checkout.");
    }
    return env.STRIPE_PRICE_PREMIUM;
  }

  if (plan === "pro") {
    if (!env.STRIPE_PRICE_PRO) {
      throw new Error("Missing STRIPE_PRICE_PRO for checkout.");
    }
    return env.STRIPE_PRICE_PRO;
  }

  if (!env.STRIPE_PRICE_BUSINESS) {
    throw new Error("Missing STRIPE_PRICE_BUSINESS for checkout.");
  }

  return env.STRIPE_PRICE_BUSINESS;
}

export function getStripePriceToPlanMap(): Record<string, CheckoutPlan> {
  const env = getStripeServerEnv();
  const output: Record<string, CheckoutPlan> = {};

  if (env.STRIPE_PRICE_PREMIUM) {
    output[env.STRIPE_PRICE_PREMIUM] = "premium";
  }

  if (env.STRIPE_PRICE_PRO) {
    output[env.STRIPE_PRICE_PRO] = "pro";
  }

  if (env.STRIPE_PRICE_BUSINESS) {
    output[env.STRIPE_PRICE_BUSINESS] = "business";
  }

  return output;
}
