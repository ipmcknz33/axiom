"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canReadApprovalsQueue = canReadApprovalsQueue;
function canReadApprovalsQueue(input) {
    if (!input.requestedUserId) {
        return {
            allowed: true,
            effectiveRequesterUserId: input.actor.role === "admin" ? undefined : input.actor.userId,
        };
    }
    if (input.requestedUserId === input.actor.userId) {
        return {
            allowed: true,
            effectiveRequesterUserId: input.requestedUserId,
        };
    }
    if (input.actor.role === "admin") {
        return {
            allowed: true,
            effectiveRequesterUserId: input.requestedUserId,
        };
    }
    return {
        allowed: false,
        code: "approvals_queue_forbidden",
        message: "Approval queue access is limited to the owner or an admin.",
        status: 403,
    };
}
