"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const chat_access_1 = require("../server/security/chat-access");
(0, node_test_1.default)("allows matching user ownership without requested action", () => {
    const result = (0, chat_access_1.evaluateChatAccess)({
        actor: { role: "user", userId: "11111111-1111-4111-8111-111111111111" },
        payloadUserId: "11111111-1111-4111-8111-111111111111",
        requiresApprovalForRequestedAction: false,
    });
    strict_1.default.equal(result.allowed, true);
});
(0, node_test_1.default)("denies ownership mismatch", () => {
    const result = (0, chat_access_1.evaluateChatAccess)({
        actor: { role: "user", userId: "11111111-1111-4111-8111-111111111111" },
        payloadUserId: "22222222-2222-4222-8222-222222222222",
        requiresApprovalForRequestedAction: false,
    });
    strict_1.default.equal(result.allowed, false);
    if (!result.allowed) {
        strict_1.default.equal(result.code, "chat_user_mismatch");
        strict_1.default.equal(result.status, 403);
    }
});
(0, node_test_1.default)("denies service role initiating high-risk approval workflow", () => {
    const result = (0, chat_access_1.evaluateChatAccess)({
        actor: { role: "service", userId: "11111111-1111-4111-8111-111111111111" },
        payloadUserId: "11111111-1111-4111-8111-111111111111",
        requestedAction: "production.code_change",
        requiresApprovalForRequestedAction: true,
    });
    strict_1.default.equal(result.allowed, false);
    if (!result.allowed) {
        strict_1.default.equal(result.code, "approval_initiation_forbidden");
        strict_1.default.equal(result.status, 403);
    }
});
(0, node_test_1.default)("allows user role initiating high-risk approval workflow", () => {
    const result = (0, chat_access_1.evaluateChatAccess)({
        actor: { role: "user", userId: "11111111-1111-4111-8111-111111111111" },
        payloadUserId: "11111111-1111-4111-8111-111111111111",
        requestedAction: "production.code_change",
        requiresApprovalForRequestedAction: true,
    });
    strict_1.default.equal(result.allowed, true);
});
