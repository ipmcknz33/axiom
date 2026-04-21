"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateChatAccess = evaluateChatAccess;
function canInitiateApprovalWorkflow(role) {
    return role === "admin" || role === "user";
}
function evaluateChatAccess(input) {
    if (input.payloadUserId !== input.actor.userId) {
        return {
            allowed: false,
            code: "chat_user_mismatch",
            message: "Authenticated user does not match payload userId.",
            status: 403,
        };
    }
    if (input.requestedAction &&
        input.requiresApprovalForRequestedAction &&
        !canInitiateApprovalWorkflow(input.actor.role)) {
        return {
            allowed: false,
            code: "approval_initiation_forbidden",
            message: "Role is not permitted to initiate approval workflows.",
            status: 403,
        };
    }
    return { allowed: true };
}
