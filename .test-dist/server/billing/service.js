"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSessionForUser = createCheckoutSessionForUser;
exports.getBillingSnapshotForUser = getBillingSnapshotForUser;
const env_1 = require("@/lib/stripe/env");
const repository_1 = require("@/server/entitlements/repository");
const stripe_1 = require("@/server/billing/stripe");
async function createCheckoutSessionForUser(input) {
    const entitlement = await (0, repository_1.getAccountEntitlement)(input.userId);
    const env = (0, env_1.getStripeServerEnv)();
    return (0, stripe_1.createStripeCheckoutSession)({
        baseUrl: env.NEXT_PUBLIC_SITE_URL,
        existingCustomerId: entitlement?.stripe_customer_id ?? undefined,
        plan: input.plan,
        userId: input.userId,
    });
}
async function getBillingSnapshotForUser(userId) {
    const entitlement = await (0, repository_1.getAccountEntitlement)(userId);
    return (0, stripe_1.fetchStripeBillingSnapshot)({
        stripeCustomerId: entitlement?.stripe_customer_id ?? undefined,
        stripeSubscriptionId: entitlement?.stripe_subscription_id ?? undefined,
    });
}
