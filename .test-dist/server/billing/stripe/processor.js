"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processStripeWebhookEvent = processStripeWebhookEvent;
const mapping_1 = require("./mapping");
async function processStripeWebhookEvent(event, store) {
    const start = await store.beginWebhookEvent({
        eventId: event.id,
        eventType: event.type,
        payload: event,
    });
    if (start.deduped) {
        return { deduped: true, status: "processed" };
    }
    const transition = (0, mapping_1.mapStripeEventToTransition)(event);
    if (!transition) {
        await store.markWebhookEvent({
            eventId: event.id,
            status: "ignored",
        });
        return {
            deduped: false,
            reason: "unsupported_event_type",
            status: "ignored",
        };
    }
    try {
        await store.applyTransition(transition);
        await store.markWebhookEvent({
            eventId: event.id,
            status: "processed",
        });
        return { deduped: false, status: "processed" };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "unknown_error";
        await store.markWebhookEvent({
            error: message,
            eventId: event.id,
            status: "failed",
        });
        return {
            deduped: false,
            reason: message,
            status: "failed",
        };
    }
}
