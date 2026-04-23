import { ApiError } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AccountEntitlementRow = {
  access_status: "active" | "inactive" | "expired";
  billing_status: string | null;
  plan: "free" | "trial" | "premium" | "pro" | "business";
  role: "owner" | "admin" | "member" | "internal";
  trial_ends_at: string | null;
  trial_started_at: string | null;
  updated_at: string;
  user_id: string;
};

export async function getAccountEntitlement(
  userId: string,
): Promise<AccountEntitlementRow | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await (supabase.from("account_entitlements") as any)
      .select(
        "user_id,plan,role,access_status,billing_status,trial_started_at,trial_ends_at,updated_at",
      )
      .eq("user_id", userId)
      .single();

    if (error?.code === "PGRST116") {
      return null;
    }

    if (error) {
      throw new Error(error.message);
    }

    return (data as AccountEntitlementRow | null) ?? null;
  } catch {
    throw new ApiError({
      code: "entitlement_store_unavailable",
      message: "entitlement store unavailable",
      status: 503,
      expose: false,
    });
  }
}

export async function createDefaultTrialEntitlement(
  userId: string,
): Promise<AccountEntitlementRow> {
  try {
    const now = new Date();
    const trialEndsAt = new Date(now.valueOf() + 3 * 24 * 60 * 60 * 1000);

    const supabase = createSupabaseServerClient();
    const { data, error } = await (supabase.from("account_entitlements") as any)
      .insert({
        access_status: "active",
        billing_status: "trialing",
        plan: "trial",
        role: "member",
        trial_ends_at: trialEndsAt.toISOString(),
        trial_started_at: now.toISOString(),
        user_id: userId,
      })
      .select(
        "user_id,plan,role,access_status,billing_status,trial_started_at,trial_ends_at,updated_at",
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "No entitlement row returned");
    }

    return data as AccountEntitlementRow;
  } catch {
    throw new ApiError({
      code: "entitlement_store_unavailable",
      message: "entitlement store unavailable",
      status: 503,
      expose: false,
    });
  }
}
