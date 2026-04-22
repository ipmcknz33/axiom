import type { AxiomRole } from "@/server/security/auth";

export type Plan = "free" | "trial" | "pro" | "business" | "internal";

export type FeatureKey =
  | "agents.advanced"
  | "memory.long_term"
  | "connectors.premium"
  | "projects.unlimited"
  | "approvals.advanced";

export type UsageMetric =
  | "messages.monthly"
  | "projects.total"
  | "connectors.active";

export type EntitlementSnapshot = {
  actorRole: AxiomRole;
  expiresAt?: string;
  features: Record<FeatureKey, boolean>;
  limits: Record<UsageMetric, number | null>;
  plan: Plan;
  trialExpired: boolean;
  userId: string;
};

export type BillingSubscriptionState = {
  plan: Plan;
  status: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
  trialEndsAt?: string;
};

export type BillingState = {
  overrides: Partial<Record<FeatureKey, boolean>>;
  subscription?: BillingSubscriptionState;
  usage: Partial<Record<UsageMetric, number>>;
};
