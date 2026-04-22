export type AccessPlan = "free" | "trial" | "premium" | "pro" | "business";
export type AccessRole = "owner" | "admin" | "member" | "internal";
export type AccessStatus = "active" | "inactive" | "expired";

export type AccessFeatureKey =
  | "advisor.advanced"
  | "agents.advanced"
  | "memory.long_term"
  | "connectors.premium"
  | "projects.unlimited"
  | "permissions.explainability";

export type AccessSnapshot = {
  accessStatus: AccessStatus;
  billingStatus?: string;
  canUpgrade: boolean;
  expiresAt?: string;
  features: Record<AccessFeatureKey, boolean>;
  lastStripeEventId?: string;
  plan: AccessPlan;
  role: AccessRole;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeReady: boolean;
  trialDaysRemaining?: number;
  trialExpired: boolean;
  updatedAt?: string;
  userId: string;
};

const FEATURE_MATRIX: Record<AccessPlan, Record<AccessFeatureKey, boolean>> = {
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

function cloneFeatures(plan: AccessPlan) {
  return { ...FEATURE_MATRIX[plan] };
}

function normalizePlan(input: {
  now: Date;
  plan?: AccessPlan;
  trialEndsAt?: string;
  trialStartedAt?: string;
}) {
  const plan = input.plan ?? "free";

  if (plan !== "trial") {
    return {
      expiresAt: undefined as string | undefined,
      plan,
      trialDaysRemaining: undefined as number | undefined,
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
      plan: "free" as AccessPlan,
      trialDaysRemaining: 0,
      trialExpired: true,
    };
  }

  return {
    expiresAt: expiresAt.toISOString(),
    plan: "trial" as AccessPlan,
    trialDaysRemaining: Math.ceil(msRemaining / (24 * 60 * 60 * 1000)),
    trialExpired: false,
  };
}

export function resolveAccessSnapshot(input: {
  accessStatus?: AccessStatus;
  billingStatus?: string;
  lastStripeEventId?: string;
  now?: Date;
  plan?: AccessPlan;
  role: AccessRole;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: string;
  trialStartedAt?: string;
  updatedAt?: string;
  userId: string;
}): AccessSnapshot {
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
