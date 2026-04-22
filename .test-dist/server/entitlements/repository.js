"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountEntitlement = getAccountEntitlement;
exports.createDefaultTrialEntitlement = createDefaultTrialEntitlement;
const response_1 = require("@/lib/api/response");
const server_1 = require("@/lib/supabase/server");
async function getAccountEntitlement(userId) {
    try {
        const supabase = (0, server_1.createSupabaseServerClient)();
        const { data, error } = await supabase.from("account_entitlements")
            .select("user_id,plan,role,access_status,billing_status,last_stripe_event_id,trial_started_at,trial_ends_at,stripe_customer_id,stripe_subscription_id,updated_at")
            .eq("user_id", userId)
            .single();
        if (error?.code === "PGRST116") {
            return null;
        }
        if (error) {
            throw new Error(error.message);
        }
        return data ?? null;
    }
    catch {
        throw new response_1.ApiError({
            code: "entitlement_store_unavailable",
            message: "entitlement store unavailable",
            status: 503,
            expose: false,
        });
    }
}
async function createDefaultTrialEntitlement(userId) {
    try {
        const now = new Date();
        const trialEndsAt = new Date(now.valueOf() + 3 * 24 * 60 * 60 * 1000);
        const supabase = (0, server_1.createSupabaseServerClient)();
        const { data, error } = await supabase.from("account_entitlements")
            .insert({
            access_status: "active",
            billing_status: "trialing",
            last_stripe_event_id: null,
            plan: "trial",
            role: "member",
            trial_ends_at: trialEndsAt.toISOString(),
            trial_started_at: now.toISOString(),
            user_id: userId,
        })
            .select("user_id,plan,role,access_status,billing_status,last_stripe_event_id,trial_started_at,trial_ends_at,stripe_customer_id,stripe_subscription_id,updated_at")
            .single();
        if (error || !data) {
            throw new Error(error?.message ?? "No entitlement row returned");
        }
        return data;
    }
    catch {
        throw new response_1.ApiError({
            code: "entitlement_store_unavailable",
            message: "entitlement store unavailable",
            status: 503,
            expose: false,
        });
    }
}
