"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const approvals_access_1 = require("../server/security/approvals-access");
(0, node_test_1.default)("user reads own approvals queue", () => {
    const result = (0, approvals_access_1.canReadApprovalsQueue)({
        actor: { role: "user", userId: "11111111-1111-4111-8111-111111111111" },
        requestedUserId: "11111111-1111-4111-8111-111111111111",
    });
    strict_1.default.equal(result.allowed, true);
    if (result.allowed) {
        strict_1.default.equal(result.effectiveRequesterUserId, "11111111-1111-4111-8111-111111111111");
    }
});
(0, node_test_1.default)("user cannot read another user's queue", () => {
    const result = (0, approvals_access_1.canReadApprovalsQueue)({
        actor: { role: "user", userId: "11111111-1111-4111-8111-111111111111" },
        requestedUserId: "22222222-2222-4222-8222-222222222222",
    });
    strict_1.default.equal(result.allowed, false);
    if (!result.allowed) {
        strict_1.default.equal(result.code, "approvals_queue_forbidden");
        strict_1.default.equal(result.status, 403);
    }
});
(0, node_test_1.default)("admin can read any approvals queue", () => {
    const result = (0, approvals_access_1.canReadApprovalsQueue)({
        actor: { role: "admin", userId: "11111111-1111-4111-8111-111111111111" },
        requestedUserId: "22222222-2222-4222-8222-222222222222",
    });
    strict_1.default.equal(result.allowed, true);
    if (result.allowed) {
        strict_1.default.equal(result.effectiveRequesterUserId, "22222222-2222-4222-8222-222222222222");
    }
});
(0, node_test_1.default)("admin without query reads all approvals", () => {
    const result = (0, approvals_access_1.canReadApprovalsQueue)({
        actor: { role: "admin", userId: "11111111-1111-4111-8111-111111111111" },
    });
    strict_1.default.equal(result.allowed, true);
    if (result.allowed) {
        strict_1.default.equal(result.effectiveRequesterUserId, undefined);
    }
});
