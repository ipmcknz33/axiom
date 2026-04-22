import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { mapStripeEventToTransition } from "../server/billing/stripe/mapping";
import { processStripeWebhookEvent } from "../server/billing/stripe/processor";
import { verifyStripeSignature } from "../server/billing/stripe/signature";
import type {
  BillingTransition,
  StripeWebhookEvent,
} from "../server/billing/stripe/types";

test("stripe signature verification accepts valid and rejects invalid payloads", () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({
    id: "evt_test",
    type: "customer.subscription.updated",
  });
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  const validHeader = `t=${timestamp},v1=${digest}`;
  const invalidHeader = `t=${timestamp},v1=invalid`;

  assert.equal(
    verifyStripeSignature({ payload, secret, signatureHeader: validHeader }),
    true,
  );

  assert.equal(
    verifyStripeSignature({ payload, secret, signatureHeader: invalidHeader }),
    false,
  );
});

test("stripe mapping resolves subscription deleted transition", () => {
  const event: StripeWebhookEvent = {
    data: {
      object: {
        customer: "cus_123",
        id: "sub_123",
        metadata: { user_id: "11111111-1111-4111-8111-111111111111" },
      },
    },
    id: "evt_deleted",
    type: "customer.subscription.deleted",
  };

  const transition = mapStripeEventToTransition(event);

  assert.ok(transition);
  if (transition) {
    assert.equal(transition.accessStatus, "expired");
    assert.equal(transition.plan, "free");
    assert.equal(transition.userId, "11111111-1111-4111-8111-111111111111");
  }
});

test("webhook processor is idempotent for duplicate event IDs", async () => {
  const started = new Set<string>();
  let appliedCount = 0;

  const event: StripeWebhookEvent = {
    data: {
      object: {
        customer: "cus_123",
        id: "sub_123",
        metadata: { user_id: "11111111-1111-4111-8111-111111111111" },
      },
    },
    id: "evt_idempotent",
    type: "customer.subscription.created",
  };

  const store = {
    applyTransition: async (_transition: BillingTransition) => {
      appliedCount += 1;
    },
    beginWebhookEvent: async (input: {
      eventId: string;
      eventType: string;
      payload: unknown;
    }) => {
      const deduped = started.has(input.eventId);
      if (!deduped) {
        started.add(input.eventId);
      }
      return { deduped };
    },
    markWebhookEvent: async (_input: {
      error?: string;
      eventId: string;
      status: "failed" | "ignored" | "processed";
    }) => {
      return;
    },
  };

  const first = await processStripeWebhookEvent(event, store);
  const second = await processStripeWebhookEvent(event, store);

  assert.equal(first.status, "processed");
  assert.equal(first.deduped, false);
  assert.equal(second.status, "processed");
  assert.equal(second.deduped, true);
  assert.equal(appliedCount, 1);
});
