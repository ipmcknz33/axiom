import { ApiError } from "../../lib/api/response";
import type {
  AccessFeatureKey,
  AccessSnapshot,
} from "../../lib/entitlements/access";

export type GuardDecision = {
  allowed: boolean;
  code?: string;
  message?: string;
  status?: number;
};

export function evaluateActiveAccess(snapshot: AccessSnapshot): GuardDecision {
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

export function evaluateFeatureAccess(
  snapshot: AccessSnapshot,
  feature: AccessFeatureKey,
): GuardDecision {
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

export function assertActiveAccess(snapshot: AccessSnapshot): GuardDecision {
  const decision = evaluateActiveAccess(snapshot);

  if (!decision.allowed) {
    throw new ApiError({
      code: decision.code ?? "entitlement_access_inactive",
      message: decision.message ?? "Account access is not active.",
      status: decision.status ?? 403,
      expose: true,
    });
  }

  return decision;
}

export function assertFeatureAccess(
  snapshot: AccessSnapshot,
  feature: AccessFeatureKey,
): GuardDecision {
  const decision = evaluateFeatureAccess(snapshot, feature);

  if (!decision.allowed) {
    throw new ApiError({
      code: decision.code ?? "feature_locked",
      message: decision.message ?? `Feature ${feature} is locked.`,
      status: decision.status ?? 402,
      expose: true,
    });
  }

  return decision;
}
