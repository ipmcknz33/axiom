"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripeServerEnv = getStripeServerEnv;
let stripeEnvCache;
function requireString(name, raw) {
    if (!raw || raw.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return raw;
}
function requireUrl(name, raw) {
    const value = requireString(name, raw);
    try {
        new URL(value);
        return value;
    }
    catch {
        throw new Error(`Environment variable ${name} must be a valid URL.`);
    }
}
function getStripeServerEnv() {
    if (!stripeEnvCache) {
        stripeEnvCache = {
            NEXT_PUBLIC_SITE_URL: requireUrl("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL),
            STRIPE_SECRET_KEY: requireString("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY),
            STRIPE_WEBHOOK_SECRET: requireString("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET),
            STRIPE_PRICE_BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
            STRIPE_PRICE_PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
            STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
        };
    }
    return stripeEnvCache;
}
