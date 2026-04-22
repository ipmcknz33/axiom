"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUserEntitlementState = resolveUserEntitlementState;
const access_1 = require("@/lib/entitlements/access");
const repository_1 = require("@/server/entitlements/repository");
async function resolveUserEntitlementState(userId) {
    const row = (await (0, repository_1.getAccountEntitlement)(userId)) ??
        (await (0, repository_1.createDefaultTrialEntitlement)(userId));
    return (0, access_1.resolveAccessSnapshot)({
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
