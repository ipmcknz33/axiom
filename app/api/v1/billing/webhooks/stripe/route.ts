import { ok } from "@/lib/api/response";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  return ok(
    {
      accepted: true,
      next: "billing.sync_subscription",
      note: "Stripe webhook verification and idempotent processing will be implemented in phase 2.",
      received: {
        hasPayload: payload.length > 0,
        hasSignature: !!signature,
      },
    },
    { status: 202 },
  );
}
