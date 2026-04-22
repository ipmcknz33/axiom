"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEntitlements = resolveEntitlements;
const PLAN_FEATURES = {
    free: {
        "agents.advanced": false,
        "approvals.advanced": false,
        "connectors.premium": false,
        "memory.long_term": false,
        "projects.unlimited": false,
    },
    trial: {
        "agents.advanced": true,
        "approvals.advanced": true,
        "connectors.premium": true,
        "memory.long_term": true,
        "projects.unlimited": true,
    },
    pro: {
        "agents.advanced": true,
        "approvals.advanced": true,
        "connectors.premium": true,
        "memory.long_term": true,
        "projects.unlimited": true,
    },
    business: {
        "agents.advanced": true,
        "approvals.advanced": true,
        "connectors.premium": true,
        "memory.long_term": true,
        "projects.unlimited": true,
    },
    internal: {
        "agents.advanced": true,
        "approvals.advanced": true,
        "connectors.premium": true,
        "memory.long_term": true,
        "projects.unlimited": true,
    },
};
const PLAN_LIMITS = {
    free: {
        "connectors.active": 2,
        "messages.monthly": 500,
        "projects.total": 3,
    },
    trial: {
        "connectors.active": 10,
        "messages.monthly": 5000,
        "projects.total": 20,
    },
    pro: {
        "connectors.active": 25,
        "messages.monthly": 20000,
        "projects.total": 100,
    },
    business: {
        "connectors.active": null,
        "messages.monthly": null,
        "projects.total": null,
    },
    internal: {
        "connectors.active": null,
        "messages.monthly": null,
        "projects.total": null,
    },
};
function hasInternalBypass(role) {
    return role === "admin" || role === "service";
}
function cloneFeatures(plan) {
    return { ...PLAN_FEATURES[plan] };
}
function cloneLimits(plan) {
    return { ...PLAN_LIMITS[plan] };
}
function normalizePlan(state, now) {
    const subscription = state.subscription;
    if (!subscription) {
        return { plan: "free", trialExpired: false };
    }
    if (subscription.plan !== "trial") {
        return { plan: subscription.plan, trialExpired: false };
    }
    const trialEndsAt = subscription.trialEndsAt
        ? new Date(subscription.trialEndsAt)
        : null;
    if (!trialEndsAt || Number.isNaN(trialEndsAt.valueOf())) {
        return { plan: "free", trialExpired: true };
    }
    if (trialEndsAt <= now) {
        return { plan: "free", trialExpired: true };
    }
    return { plan: "trial", trialExpired: false };
}
function resolveEntitlements(input) {
    const now = input.now ?? new Date();
    if (hasInternalBypass(input.actorRole)) {
        return {
            actorRole: input.actorRole,
            features: cloneFeatures("internal"),
            limits: cloneLimits("internal"),
            plan: "internal",
            trialExpired: false,
            userId: input.userId,
        };
    }
    const normalized = normalizePlan(input.state, now);
    const features = cloneFeatures(normalized.plan);
    const limits = cloneLimits(normalized.plan);
    for (const [feature, enabled] of Object.entries(input.state.overrides)) {
        if (enabled === undefined) {
            continue;
        }
        features[feature] = enabled;
    }
    return {
        actorRole: input.actorRole,
        expiresAt: input.state.subscription?.trialEndsAt,
        features,
        limits,
        plan: normalized.plan,
        trialExpired: normalized.trialExpired,
        userId: input.userId,
    };
}
