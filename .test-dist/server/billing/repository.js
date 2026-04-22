"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillingState = getBillingState;
exports.beginBillingWebhookEvent = beginBillingWebhookEvent;
exports.updateBillingWebhookEventStatus = updateBillingWebhookEventStatus;
exports.applyBillingTransition = applyBillingTransition;
const response_1 = require("@/lib/api/response");
const server_1 = require("@/lib/supabase/server");
async function getBillingState(userId) {
    try {
        const supabase = (0, server_1.createSupabaseServerClient)();
        const { data: subscriptions, error: subscriptionError } = await supabase
            .from("billing_subscriptions")
            .select("plan, status, trial_ends_at, created_at")
            .eq("user_id", userId)
            .returns();
        if (subscriptionError) {
            throw new Error(subscriptionError.message);
        }
        const newestSubscription = [...(subscriptions ?? [])]
            .sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf())
            .find((row) => row.status === "active" || row.status === "trialing");
        const { data: overrides, error: overrideError } = await supabase
            .from("billing_entitlement_overrides")
            .select("feature_key, enabled")
            .eq("user_id", userId)
            .returns();
        if (overrideError) {
            throw new Error(overrideError.message);
        }
        const { data: usageEvents, error: usageError } = await supabase
            .from("billing_usage_events")
            .select("metric, quantity, event_type")
            .eq("user_id", userId)
            .returns();
        if (usageError) {
            throw new Error(usageError.message);
        }
        const usage = {};
        for (const event of usageEvents ?? []) {
            const metric = event.metric;
            if (event.event_type === "set") {
                usage[metric] = event.quantity;
                continue;
            }
            const existing = usage[metric] ?? 0;
            usage[metric] =
                event.event_type === "decrement"
                    ? Math.max(0, existing - event.quantity)
                    : existing + event.quantity;
        }
        const overrideMap = {};
        for (const row of overrides ?? []) {
            overrideMap[row.feature_key] = row.enabled;
        }
        return {
            overrides: overrideMap,
            subscription: newestSubscription
                ? {
                    plan: newestSubscription.plan,
                    status: newestSubscription.status,
                    trialEndsAt: newestSubscription.trial_ends_at ?? undefined,
                }
                : undefined,
            usage,
        };
    }
    catch {
        throw new response_1.ApiError({
            code: "billing_store_unavailable",
            message: "billing store unavailable",
            status: 503,
            expose: false,
        });
    }
}
async function beginBillingWebhookEvent(input) {
    try {
        const supabase = (0, server_1.createSupabaseServerClient)();
        const { data: existing, error: existingError } = await supabase
            .from("billing_webhook_events")
            .select("event_id,status")
            .eq("event_id", input.eventId)
            .returns();
        if (existingError) {
            throw new Error(existingError.message);
        }
        if (existing && existing.length > 0) {
            return { deduped: true };
        }
        const { error: insertError } = await supabase.from("billing_webhook_events").insert({
            event_id: input.eventId,
            event_type: input.eventType,
            payload: input.payload,
            status: "processing",
        });
        if (insertError) {
            throw new Error(insertError.message);
        }
        return { deduped: false };
    }
    catch {
        throw new response_1.ApiError({
            code: "billing_store_unavailable",
            message: "billing store unavailable",
            status: 503,
            expose: false,
        });
    }
}
async function updateBillingWebhookEventStatus(input) {
    try {
        const supabase = (0, server_1.createSupabaseServerClient)();
        const { error } = await supabase.from("billing_webhook_events")
            .update({
            error: input.error ?? null,
            processed_at: new Date().toISOString(),
            status: input.status,
            updated_at: new Date().toISOString(),
        })
            .eq("event_id", input.eventId);
        if (error) {
            throw new Error(error.message);
        }
    }
    catch {
        throw new response_1.ApiError({
            code: "billing_store_unavailable",
            message: "billing store unavailable",
            status: 503,
            expose: false,
        });
    }
}
async function resolveEntitlementUserId(transition) {
    if (transition.userId) {
        return transition.userId;
    }
    if (!transition.stripeCustomerId) {
        return null;
    }
    const supabase = (0, server_1.createSupabaseServerClient)();
    const { data, error } = await supabase
        .from("account_entitlements")
        .select("user_id")
        .eq("stripe_customer_id", transition.stripeCustomerId)
        .returns();
    if (error) {
        throw new Error(error.message);
    }
    return data?.[0]?.user_id ?? null;
}
async function applyBillingTransition(transition) {
    try {
        const userId = await resolveEntitlementUserId(transition);
        if (!userId) {
            throw new Error("Unable to resolve user for billing transition.");
        }
        const supabase = (0, server_1.createSupabaseServerClient)();
        const { data: existingRows, error: existingError } = await supabase
            .from("account_entitlements")
            .select("user_id,role")
            .eq("user_id", userId)
            .returns();
        if (existingError) {
            throw new Error(existingError.message);
        }
        const existingRole = existingRows?.[0]?.role ?? "member";
        const effectiveAccessStatus = existingRole === "owner" || existingRole === "internal"
            ? "active"
            : transition.accessStatus;
        const { error: upsertError } = await supabase.from("account_entitlements").upsert({
            access_status: effectiveAccessStatus,
            billing_status: transition.billingStatus ?? null,
            last_stripe_event_id: transition.eventId,
            plan: transition.plan,
            role: transition.role ?? existingRole,
            stripe_customer_id: transition.stripeCustomerId ?? null,
            stripe_subscription_id: transition.stripeSubscriptionId ?? null,
            trial_ends_at: transition.trialEndsAt ?? null,
            updated_at: new Date().toISOString(),
            user_id: userId,
        }, { onConflict: "user_id" });
        if (upsertError) {
            throw new Error(upsertError.message);
        }
    }
    catch {
        throw new response_1.ApiError({
            code: "billing_store_unavailable",
            message: "billing store unavailable",
            status: 503,
            expose: false,
        });
    }
}
