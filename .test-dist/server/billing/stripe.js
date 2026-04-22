"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeCheckoutSession = createStripeCheckoutSession;
exports.fetchStripeBillingSnapshot = fetchStripeBillingSnapshot;
const env_1 = require("@/lib/stripe/env");
const plans_1 = require("@/server/billing/plans");
function authHeader() {
    const env = (0, env_1.getStripeServerEnv)();
    return {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
    };
}
async function createStripeCheckoutSession(input) {
    const priceId = (0, plans_1.resolvePriceIdForPlan)(input.plan);
    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("success_url", `${input.baseUrl}/app?billing=success`);
    form.set("cancel_url", `${input.baseUrl}/app?billing=canceled`);
    form.set(`metadata[${plans_1.STRIPE_METADATA_USER_ID}]`, input.userId);
    form.set(`metadata[${plans_1.STRIPE_METADATA_PLAN}]`, input.plan);
    form.set("metadata[price_id]", priceId);
    form.set(`subscription_data[metadata][${plans_1.STRIPE_METADATA_USER_ID}]`, input.userId);
    form.set(`subscription_data[metadata][${plans_1.STRIPE_METADATA_PLAN}]`, input.plan);
    if (input.existingCustomerId) {
        form.set("customer", input.existingCustomerId);
    }
    else {
        form.set("customer_creation", "always");
    }
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        body: form.toString(),
        headers: authHeader(),
        method: "POST",
    });
    const data = (await response.json());
    if (!response.ok || !data.id || !data.url) {
        throw new Error(data.error?.message ?? "Failed to create Stripe checkout session.");
    }
    return {
        checkoutSessionId: data.id,
        checkoutUrl: data.url,
        priceId,
    };
}
async function fetchStripeBillingSnapshot(input) {
    if (!input.stripeSubscriptionId) {
        return {
            billingState: "processing",
            plan: "free",
            stripeCustomerId: input.stripeCustomerId,
            stripeSubscriptionId: undefined,
        };
    }
    const subResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${input.stripeSubscriptionId}`, {
        headers: authHeader(),
        method: "GET",
    });
    const subPayload = (await subResponse.json());
    if (!subResponse.ok) {
        throw new Error(subPayload.error?.message ?? "Unable to fetch Stripe subscription.");
    }
    const priceId = subPayload.items?.data?.[0]?.price?.id;
    const plan = (0, plans_1.resolvePlanForPriceId)(priceId) ?? "free";
    return {
        billingState: (0, plans_1.mapStripeSubscriptionStatus)(subPayload.status),
        currentPeriodEnd: typeof subPayload.current_period_end === "number"
            ? new Date(subPayload.current_period_end * 1000).toISOString()
            : undefined,
        plan,
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: subPayload.id,
    };
}
