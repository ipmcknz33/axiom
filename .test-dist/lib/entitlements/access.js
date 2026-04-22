"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAccessSnapshot = resolveAccessSnapshot;
const FEATURE_MATRIX = {
    free: {
        "agents.advanced": false,
        "advisor.advanced": true,
        "connectors.premium": false,
        "memory.long_term": false,
        "permissions.explainability": true,
        "projects.unlimited": false,
    },
    trial: {
        "agents.advanced": true,
        "advisor.advanced": true,
        "connectors.premium": true,
        "memory.long_term": true,
        "permissions.explainability": true,
        "projects.unlimited": true,
    },
    premium: {
        "agents.advanced": true,
        "advisor.advanced": true,
        "connectors.premium": true,
        "memory.long_term": true,
        "permissions.explainability": true,
        "projects.unlimited": true,
    },
    pro: {
        "agents.advanced": true,
        "advisor.advanced": true,
        "connectors.premium": true,
        "memory.long_term": true,
        "permissions.explainability": true,
        "projects.unlimited": true,
    },
    business: {
        "agents.advanced": true,
        "advisor.advanced": true,
        "connectors.premium": true,
        "memory.long_term": true,
        "permissions.explainability": true,
        "projects.unlimited": true,
    },
};
function cloneFeatures(plan) {
    return { ...FEATURE_MATRIX[plan] };
}
function normalizePlan(input) {
    const plan = input.plan ?? "free";
    if (plan !== "trial") {
        return {
            expiresAt: undefined,
            plan,
            trialDaysRemaining: undefined,
            trialExpired: false,
        };
    }
    const trialStart = input.trialStartedAt
        ? new Date(input.trialStartedAt)
        : new Date(input.now);
    const expiresAt = input.trialEndsAt
        ? new Date(input.trialEndsAt)
        : new Date(trialStart.valueOf() + 3 * 24 * 60 * 60 * 1000);
    const msRemaining = expiresAt.valueOf() - input.now.valueOf();
    if (msRemaining <= 0) {
        return {
            expiresAt: expiresAt.toISOString(),
            plan: "free",
            trialDaysRemaining: 0,
            trialExpired: true,
        };
    }
    return {
        expiresAt: expiresAt.toISOString(),
        plan: "trial",
        trialDaysRemaining: Math.ceil(msRemaining / (24 * 60 * 60 * 1000)),
        trialExpired: false,
    };
}
function resolveAccessSnapshot(input) {
    const accessStatus = input.accessStatus ?? "active";
    if (accessStatus !== "active") {
        return {
            accessStatus,
            billingStatus: input.billingStatus,
            canUpgrade: true,
            features: cloneFeatures("free"),
            lastStripeEventId: input.lastStripeEventId,
            plan: "free",
            role: input.role,
            stripeCustomerId: input.stripeCustomerId,
            stripeReady: !!input.stripeCustomerId,
            stripeSubscriptionId: input.stripeSubscriptionId,
            trialExpired: true,
            updatedAt: input.updatedAt,
            userId: input.userId,
        };
    }
    if (input.role === "owner" || input.role === "internal") {
        return {
            accessStatus,
            billingStatus: input.billingStatus,
            canUpgrade: false,
            features: cloneFeatures("business"),
            lastStripeEventId: input.lastStripeEventId,
            plan: "business",
            role: input.role,
            stripeCustomerId: input.stripeCustomerId,
            stripeReady: true,
            stripeSubscriptionId: input.stripeSubscriptionId,
            trialExpired: false,
            updatedAt: input.updatedAt,
            userId: input.userId,
        };
    }
    const normalized = normalizePlan({
        now: input.now ?? new Date(),
        plan: input.plan,
        trialEndsAt: input.trialEndsAt,
        trialStartedAt: input.trialStartedAt,
    });
    return {
        accessStatus,
        billingStatus: input.billingStatus,
        canUpgrade: normalized.plan === "free" || normalized.plan === "trial",
        expiresAt: normalized.expiresAt,
        features: cloneFeatures(normalized.plan),
        lastStripeEventId: input.lastStripeEventId,
        plan: normalized.plan,
        role: input.role,
        stripeCustomerId: input.stripeCustomerId,
        stripeReady: !!input.stripeCustomerId || normalized.plan !== "free",
        stripeSubscriptionId: input.stripeSubscriptionId,
        trialDaysRemaining: normalized.trialDaysRemaining,
        trialExpired: normalized.trialExpired,
        updatedAt: input.updatedAt,
        userId: input.userId,
    };
}
