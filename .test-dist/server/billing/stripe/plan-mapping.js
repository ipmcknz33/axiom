"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripePriceIdForPlan = getStripePriceIdForPlan;
exports.getStripePriceToPlanMap = getStripePriceToPlanMap;
const env_1 = require("../../../lib/stripe/env");
function getStripePriceIdForPlan(plan) {
    const env = (0, env_1.getStripeServerEnv)();
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
function getStripePriceToPlanMap() {
    const env = (0, env_1.getStripeServerEnv)();
    const output = {};
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
