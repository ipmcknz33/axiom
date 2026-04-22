import {
  resolveAccessSnapshot,
  type AccessSnapshot,
} from "@/lib/entitlements/access";
import {
  createDefaultTrialEntitlement,
  getAccountEntitlement,
} from "@/server/entitlements/repository";

export async function resolveUserEntitlementState(
  userId: string,
): Promise<AccessSnapshot> {
  const row =
    (await getAccountEntitlement(userId)) ??
    (await createDefaultTrialEntitlement(userId));

  return resolveAccessSnapshot({
    accessStatus: row.access_status,
    billingStatus: row.billing_status ?? undefined,
    lastStripeEventId: row.last_stripe_event_id ?? undefined,
    plan: row.plan,
    role: row.role,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    stripeSubscriptionId: row.stripe_subscription_id ?? undefined,
    trialEndsAt: row.trial_ends_at ?? undefined,
    trialStartedAt: row.trial_started_at ?? undefined,
    updatedAt: row.updated_at,
    userId,
  });
}
