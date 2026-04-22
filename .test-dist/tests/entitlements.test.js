"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const entitlements_1 = require("../server/billing/entitlements");
(0, node_test_1.default)("free tier usage limits are enforced in snapshot", () => {
    const snapshot = (0, entitlements_1.resolveEntitlements)({
        actorRole: "user",
        state: {
            overrides: {},
            usage: {},
        },
        userId: "11111111-1111-4111-8111-111111111111",
    });
    strict_1.default.equal(snapshot.plan, "free");
    strict_1.default.equal(snapshot.features["agents.advanced"], false);
    strict_1.default.equal(snapshot.limits["messages.monthly"], 500);
});
(0, node_test_1.default)("expired trial cleanly downgrades to free", () => {
    const snapshot = (0, entitlements_1.resolveEntitlements)({
        actorRole: "user",
        now: new Date("2026-04-21T00:00:00.000Z"),
        state: {
            overrides: {},
            subscription: {
                plan: "trial",
                status: "trialing",
                trialEndsAt: "2026-04-20T00:00:00.000Z",
            },
            usage: {},
        },
        userId: "11111111-1111-4111-8111-111111111111",
    });
    strict_1.default.equal(snapshot.plan, "free");
    strict_1.default.equal(snapshot.trialExpired, true);
    strict_1.default.equal(snapshot.features["projects.unlimited"], false);
});
(0, node_test_1.default)("admin/internal bypass returns internal plan regardless of subscription", () => {
    const snapshot = (0, entitlements_1.resolveEntitlements)({
        actorRole: "admin",
        state: {
            overrides: {},
            subscription: {
                plan: "free",
                status: "active",
            },
            usage: {},
        },
        userId: "11111111-1111-4111-8111-111111111111",
    });
    strict_1.default.equal(snapshot.plan, "internal");
    strict_1.default.equal(snapshot.features["connectors.premium"], true);
    strict_1.default.equal(snapshot.limits["projects.total"], null);
});
