import { fail, failFromError, ok } from "@/lib/api/response";
import { getAuthContext } from "@/server/security/auth";
import { createCheckoutSessionForUser } from "@/server/billing/service";

type CheckoutPlan = "premium" | "pro" | "business";

function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return value === "premium" || value === "pro" || value === "business";
}

export async function POST(request: Request) {
  try {
    const auth = getAuthContext(request.headers);

    if (!auth.success) {
      return fail(auth.error, 401, "unauthenticated");
    }

    const payload = (await request.json().catch(() => null)) as {
      plan?: string;
    } | null;

    if (!payload || !isCheckoutPlan(payload.plan)) {
      return fail("Invalid checkout plan.", 400, "invalid_plan");
    }

    const checkout = await createCheckoutSessionForUser({
      plan: payload.plan,
      userId: auth.data.userId,
    });

    return ok(checkout);
  } catch (error) {
    return failFromError(error);
  }
}
