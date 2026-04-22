"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const node_test_1 = __importDefault(require("node:test"));
const mapping_1 = require("../server/billing/stripe/mapping");
const processor_1 = require("../server/billing/stripe/processor");
const signature_1 = require("../server/billing/stripe/signature");
(0, node_test_1.default)("stripe signature verification accepts valid and rejects invalid payloads", () => {
    const secret = "whsec_test_secret";
    const payload = JSON.stringify({
        id: "evt_test",
        type: "customer.subscription.updated",
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const digest = (0, node_crypto_1.createHmac)("sha256", secret)
        .update(`${timestamp}.${payload}`, "utf8")
        .digest("hex");
    const validHeader = `t=${timestamp},v1=${digest}`;
    const invalidHeader = `t=${timestamp},v1=invalid`;
    strict_1.default.equal((0, signature_1.verifyStripeSignature)({ payload, secret, signatureHeader: validHeader }), true);
    strict_1.default.equal((0, signature_1.verifyStripeSignature)({ payload, secret, signatureHeader: invalidHeader }), false);
});
(0, node_test_1.default)("stripe mapping resolves subscription deleted transition", () => {
    const event = {
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
    const transition = (0, mapping_1.mapStripeEventToTransition)(event);
    strict_1.default.ok(transition);
    if (transition) {
        strict_1.default.equal(transition.accessStatus, "expired");
        strict_1.default.equal(transition.plan, "free");
        strict_1.default.equal(transition.userId, "11111111-1111-4111-8111-111111111111");
    }
});
(0, node_test_1.default)("webhook processor is idempotent for duplicate event IDs", async () => {
    const started = new Set();
    let appliedCount = 0;
    const event = {
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
        applyTransition: async (_transition) => {
            appliedCount += 1;
        },
        beginWebhookEvent: async (input) => {
            const deduped = started.has(input.eventId);
            if (!deduped) {
                started.add(input.eventId);
            }
            return { deduped };
        },
        markWebhookEvent: async (_input) => {
            return;
        },
    };
    const first = await (0, processor_1.processStripeWebhookEvent)(event, store);
    const second = await (0, processor_1.processStripeWebhookEvent)(event, store);
    strict_1.default.equal(first.status, "processed");
    strict_1.default.equal(first.deduped, false);
    strict_1.default.equal(second.status, "processed");
    strict_1.default.equal(second.deduped, true);
    strict_1.default.equal(appliedCount, 1);
});
