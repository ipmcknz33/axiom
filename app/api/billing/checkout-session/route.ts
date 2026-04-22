import { fail, failFromError, ok } from "@/lib/api/response";
import { getStripeServerEnv } from "@/lib/stripe/env";
import { getEntitlementContext } from "@/server/entitlements/context";
import { getAccountEntitlement } from "@/server/entitlements/repository";
import { getStripePriceIdForPlan } from "@/server/billing/stripe/plan-mapping";

type CheckoutPlan = "premium" | "pro" | "business";

function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return value === "premium" || value === "pro" || value === "business";
}

export async function POST(request: Request) {
  try {
    const ctx = await getEntitlementContext(request);

    const payload = (await request.json().catch(() => null)) as {
      plan?: string;
    } | null;

    if (!payload || !isCheckoutPlan(payload.plan)) {
      return fail(
        "Invalid checkout plan. Expected premium, pro, or business.",
        400,
        "invalid_plan",
      );
    }

    const env = getStripeServerEnv();
    const priceId = getStripePriceIdForPlan(payload.plan);
    const baseUrl = env.NEXT_PUBLIC_SITE_URL;

    const entitlement = await getAccountEntitlement(ctx.userId);

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("success_url", `${baseUrl}/app?billing=success`);
    form.set("cancel_url", `${baseUrl}/app?billing=canceled`);
    form.set("metadata[user_id]", ctx.userId);
    form.set("metadata[selected_plan]", payload.plan);
    form.set("metadata[price_id]", priceId);

    if (entitlement?.stripe_customer_id) {
      form.set("customer", entitlement.stripe_customer_id);
    } else {
      form.set("customer_creation", "always");
    }

    const response = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
    );

    const data = (await response.json()) as {
      error?: { message?: string };
      id?: string;
      url?: string;
    };

    if (!response.ok || !data.url || !data.id) {
      return fail(
        data.error?.message ?? "Unable to create Stripe checkout session.",
        502,
        "stripe_checkout_error",
      );
    }

    return ok({
      checkoutSessionId: data.id,
      checkoutUrl: data.url,
      plan: payload.plan,
      priceId,
    });
  } catch (error) {
    return failFromError(error);
  }
}
