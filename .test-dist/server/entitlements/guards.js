"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateActiveAccess = evaluateActiveAccess;
exports.evaluateFeatureAccess = evaluateFeatureAccess;
exports.assertActiveAccess = assertActiveAccess;
exports.assertFeatureAccess = assertFeatureAccess;
const response_1 = require("../../lib/api/response");
function evaluateActiveAccess(snapshot) {
    if (snapshot.accessStatus !== "active") {
        return {
            allowed: false,
            code: "entitlement_access_inactive",
            message: "Account access is not active.",
            status: 403,
        };
    }
    return { allowed: true };
}
function evaluateFeatureAccess(snapshot, feature) {
    const active = evaluateActiveAccess(snapshot);
    if (!active.allowed) {
        return active;
    }
    if (!snapshot.features[feature]) {
        return {
            allowed: false,
            code: "feature_locked",
            message: `Feature ${feature} is locked for plan ${snapshot.plan}.`,
            status: 402,
        };
    }
    return { allowed: true };
}
function assertActiveAccess(snapshot) {
    const decision = evaluateActiveAccess(snapshot);
    if (!decision.allowed) {
        throw new response_1.ApiError({
            code: decision.code ?? "entitlement_access_inactive",
            message: decision.message ?? "Account access is not active.",
            status: decision.status ?? 403,
            expose: true,
        });
    }
    return decision;
}
function assertFeatureAccess(snapshot, feature) {
    const decision = evaluateFeatureAccess(snapshot, feature);
    if (!decision.allowed) {
        throw new response_1.ApiError({
            code: decision.code ?? "feature_locked",
            message: decision.message ?? `Feature ${feature} is locked.`,
            status: decision.status ?? 402,
            expose: true,
        });
    }
    return decision;
}
