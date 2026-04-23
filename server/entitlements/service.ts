import type { AccessSnapshot } from "@/lib/entitlements/access";
import type { AxiomRole } from "@/server/security/auth";

export async function resolveUserEntitlementState(
  userId: string,
  role: AxiomRole = "user",
): Promise<AccessSnapshot> {
  const now = new Date().toISOString();

  if (role === "admin" || role === "service") {
    return {
      accessStatus: "active",
      billingStatus: "internal",
      canUpgrade: false,
      features: {
        "advisor.advanced": true,
        "agents.advanced": true,
        "connectors.premium": true,
        "memory.long_term": true,
        "permissions.explainability": true,
        "projects.unlimited": true,
      },
      plan: "business",
      role: "internal",
      trialExpired: false,
      updatedAt: now,
      userId,
    };
  }

  return {
    accessStatus: "active",
    billingStatus: "coming_soon",
    canUpgrade: false,
    features: {
      "advisor.advanced": false,
      "agents.advanced": false,
      "connectors.premium": false,
      "memory.long_term": false,
      "permissions.explainability": true,
      "projects.unlimited": false,
    },
    plan: "free",
    role: "member",
    trialExpired: false,
    updatedAt: now,
    userId,
  };
}
