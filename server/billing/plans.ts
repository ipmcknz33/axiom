import type { CheckoutPlan } from "@/server/billing/stripe/plan-mapping";
import {
  getStripePriceIdForPlan,
  getStripePriceToPlanMap,
} from "@/server/billing/stripe/plan-mapping";

export const STRIPE_METADATA_USER_ID = "axiom_user_id";
export const STRIPE_METADATA_PLAN = "axiom_plan";

export function resolvePriceIdForPlan(plan: CheckoutPlan): string {
  return getStripePriceIdForPlan(plan);
}

export function resolvePlanForPriceId(
  priceId: string | undefined,
): CheckoutPlan | null {
  if (!priceId) return null;
  return getStripePriceToPlanMap()[priceId] ?? null;
}

export function mapStripeSubscriptionStatus(
  status: string | undefined,
): "active" | "trial" | "processing" | "past_due" | "canceled" | "expired" {
  const normalized = status?.toLowerCase();

  if (!normalized) return "processing";
  if (normalized === "active") return "active";
  if (normalized === "trialing") return "trial";
  if (normalized === "past_due" || normalized === "unpaid") return "past_due";
  if (normalized === "canceled") return "canceled";
  if (normalized === "incomplete" || normalized === "incomplete_expired") {
    return "processing";
  }

  return "expired";
}
