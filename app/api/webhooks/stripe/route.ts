import { fail, failFromError, ok } from "@/lib/api/response";
import { getStripeServerEnv } from "@/lib/stripe/env";
import { handleStripeWebhook } from "@/server/billing/stripe/service";
import type { StripeWebhookEvent } from "@/server/billing/stripe/types";
import { verifyStripeSignature } from "@/server/billing/stripe/signature";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const env = getStripeServerEnv();

    const valid = verifyStripeSignature({
      payload: rawBody,
      secret: env.STRIPE_WEBHOOK_SECRET,
      signatureHeader: signature,
    });

    if (!valid) {
      return fail("stripe signature invalid", 401, "stripe_signature_invalid");
    }

    const event = JSON.parse(rawBody) as StripeWebhookEvent;
    const result = await handleStripeWebhook(event);

    return ok({ result });
  } catch (error) {
    return failFromError(error);
  }
}
