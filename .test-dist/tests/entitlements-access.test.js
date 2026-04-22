"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const access_1 = require("../lib/entitlements/access");
const guards_1 = require("../server/entitlements/guards");
(0, node_test_1.default)("expired trial produces inactive premium features", () => {
    const snapshot = (0, access_1.resolveAccessSnapshot)({
        accessStatus: "active",
        plan: "trial",
        role: "member",
        trialEndsAt: "2026-04-20T00:00:00.000Z",
        trialStartedAt: "2026-04-16T00:00:00.000Z",
        userId: "11111111-1111-4111-8111-111111111111",
        now: new Date("2026-04-22T00:00:00.000Z"),
    });
    strict_1.default.equal(snapshot.plan, "free");
    strict_1.default.equal(snapshot.trialExpired, true);
    strict_1.default.equal(snapshot.features["connectors.premium"], false);
});
(0, node_test_1.default)("owner role bypass keeps premium capability", () => {
    const snapshot = (0, access_1.resolveAccessSnapshot)({
        accessStatus: "active",
        plan: "free",
        role: "owner",
        userId: "11111111-1111-4111-8111-111111111111",
    });
    const decision = (0, guards_1.evaluateFeatureAccess)(snapshot, "memory.long_term");
    strict_1.default.equal(decision.allowed, true);
});
(0, node_test_1.default)("inactive account is denied by active-access guard", () => {
    const snapshot = (0, access_1.resolveAccessSnapshot)({
        accessStatus: "inactive",
        plan: "pro",
        role: "member",
        userId: "11111111-1111-4111-8111-111111111111",
    });
    const decision = (0, guards_1.evaluateActiveAccess)(snapshot);
    strict_1.default.equal(decision.allowed, false);
    if (!decision.allowed) {
        strict_1.default.equal(decision.code, "entitlement_access_inactive");
        strict_1.default.equal(decision.status, 403);
    }
});
