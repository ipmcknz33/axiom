"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = handleStripeWebhook;
const processor_1 = require("./processor");
const repository_1 = require("../repository");
async function handleStripeWebhook(event) {
    return (0, processor_1.processStripeWebhookEvent)(event, {
        applyTransition: repository_1.applyBillingTransition,
        beginWebhookEvent: repository_1.beginBillingWebhookEvent,
        markWebhookEvent: repository_1.updateBillingWebhookEventStatus,
    });
}
