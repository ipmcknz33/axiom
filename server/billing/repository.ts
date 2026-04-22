import { ApiError } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BillingTransition } from "@/server/billing/stripe/types";
import type {
  BillingState,
  BillingSubscriptionState,
  FeatureKey,
  UsageMetric,
} from "@/server/billing/contracts";

type SubscriptionRow = {
  created_at: string;
  plan: BillingSubscriptionState["plan"];
  status: BillingSubscriptionState["status"];
  trial_ends_at: string | null;
};

type EntitlementOverrideRow = {
  enabled: boolean;
  feature_key: string;
};

type UsageEventRow = {
  event_type: "increment" | "set" | "decrement";
  metric: string;
  quantity: number;
};

type BillingWebhookEventRow = {
  event_id: string;
  status: "failed" | "ignored" | "processed" | "processing";
};

type EntitlementRoleRow = {
  role: "owner" | "admin" | "member" | "internal";
  user_id: string;
};

export async function getBillingState(userId: string): Promise<BillingState> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("billing_subscriptions")
      .select("plan, status, trial_ends_at, created_at")
      .eq("user_id", userId)
      .returns<SubscriptionRow[]>();

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    const newestSubscription = [...(subscriptions ?? [])]
      .sort(
        (a, b) =>
          new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf(),
      )
      .find((row) => row.status === "active" || row.status === "trialing");

    const { data: overrides, error: overrideError } = await supabase
      .from("billing_entitlement_overrides")
      .select("feature_key, enabled")
      .eq("user_id", userId)
      .returns<EntitlementOverrideRow[]>();

    if (overrideError) {
      throw new Error(overrideError.message);
    }

    const { data: usageEvents, error: usageError } = await supabase
      .from("billing_usage_events")
      .select("metric, quantity, event_type")
      .eq("user_id", userId)
      .returns<UsageEventRow[]>();

    if (usageError) {
      throw new Error(usageError.message);
    }

    const usage: Partial<Record<UsageMetric, number>> = {};

    for (const event of usageEvents ?? []) {
      const metric = event.metric as UsageMetric;

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

    const overrideMap: Partial<Record<FeatureKey, boolean>> = {};

    for (const row of overrides ?? []) {
      overrideMap[row.feature_key as FeatureKey] = row.enabled;
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
  } catch {
    throw new ApiError({
      code: "billing_store_unavailable",
      message: "billing store unavailable",
      status: 503,
      expose: false,
    });
  }
}

export async function beginBillingWebhookEvent(input: {
  eventId: string;
  eventType: string;
  payload: unknown;
}): Promise<{ deduped: boolean }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: existing, error: existingError } = await supabase
      .from("billing_webhook_events")
      .select("event_id,status")
      .eq("event_id", input.eventId)
      .returns<BillingWebhookEventRow[]>();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existing && existing.length > 0) {
      return { deduped: true };
    }

    const { error: insertError } = await (
      supabase.from("billing_webhook_events") as any
    ).insert({
      event_id: input.eventId,
      event_type: input.eventType,
      payload: input.payload,
      status: "processing",
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return { deduped: false };
  } catch {
    throw new ApiError({
      code: "billing_store_unavailable",
      message: "billing store unavailable",
      status: 503,
      expose: false,
    });
  }
}

export async function updateBillingWebhookEventStatus(input: {
  error?: string;
  eventId: string;
  status: "failed" | "ignored" | "processed";
}): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await (supabase.from("billing_webhook_events") as any)
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
  } catch {
    throw new ApiError({
      code: "billing_store_unavailable",
      message: "billing store unavailable",
      status: 503,
      expose: false,
    });
  }
}

async function resolveEntitlementUserId(
  transition: BillingTransition,
): Promise<string | null> {
  if (transition.userId) {
    return transition.userId;
  }

  if (!transition.stripeCustomerId) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("account_entitlements")
    .select("user_id")
    .eq("stripe_customer_id", transition.stripeCustomerId)
    .returns<Array<{ user_id: string }>>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0]?.user_id ?? null;
}

export async function applyBillingTransition(
  transition: BillingTransition,
): Promise<void> {
  try {
    const userId = await resolveEntitlementUserId(transition);

    if (!userId) {
      throw new Error("Unable to resolve user for billing transition.");
    }

    const supabase = createSupabaseServerClient();
    const { data: existingRows, error: existingError } = await supabase
      .from("account_entitlements")
      .select("user_id,role")
      .eq("user_id", userId)
      .returns<EntitlementRoleRow[]>();

    if (existingError) {
      throw new Error(existingError.message);
    }

    const existingRole = existingRows?.[0]?.role ?? "member";
    const effectiveAccessStatus =
      existingRole === "owner" || existingRole === "internal"
        ? "active"
        : transition.accessStatus;

    const { error: upsertError } = await (
      supabase.from("account_entitlements") as any
    ).upsert(
      {
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
      },
      { onConflict: "user_id" },
    );

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  } catch {
    throw new ApiError({
      code: "billing_store_unavailable",
      message: "billing store unavailable",
      status: 503,
      expose: false,
    });
  }
}
