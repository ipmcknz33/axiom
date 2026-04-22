"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRIPE_METADATA_PLAN = exports.STRIPE_METADATA_USER_ID = void 0;
exports.resolvePriceIdForPlan = resolvePriceIdForPlan;
exports.resolvePlanForPriceId = resolvePlanForPriceId;
exports.mapStripeSubscriptionStatus = mapStripeSubscriptionStatus;
const plan_mapping_1 = require("@/server/billing/stripe/plan-mapping");
exports.STRIPE_METADATA_USER_ID = "axiom_user_id";
exports.STRIPE_METADATA_PLAN = "axiom_plan";
function resolvePriceIdForPlan(plan) {
    return (0, plan_mapping_1.getStripePriceIdForPlan)(plan);
}
function resolvePlanForPriceId(priceId) {
    if (!priceId)
        return null;
    return (0, plan_mapping_1.getStripePriceToPlanMap)()[priceId] ?? null;
}
function mapStripeSubscriptionStatus(status) {
    const normalized = status?.toLowerCase();
    if (!normalized)
        return "processing";
    if (normalized === "active")
        return "active";
    if (normalized === "trialing")
        return "trial";
    if (normalized === "past_due" || normalized === "unpaid")
        return "past_due";
    if (normalized === "canceled")
        return "canceled";
    if (normalized === "incomplete" || normalized === "incomplete_expired") {
        return "processing";
    }
    return "expired";
}
