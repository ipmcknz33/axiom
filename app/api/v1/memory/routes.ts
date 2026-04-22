import { failFromError, ok } from "@/lib/api/response";
import { getEntitlementContext } from "@/server/entitlements/context";
import { assertFeatureAccess } from "@/server/entitlements/guards";
import { resolveUserEntitlementState } from "@/server/entitlements/service";

export async function GET(request: Request) {
  try {
    const ctx = await getEntitlementContext(request);
    const entitlement = await resolveUserEntitlementState(ctx.userId);
    assertFeatureAccess(entitlement, "memory.long_term");

    return ok({
      items: [],
      note: "Memory retrieval endpoint scaffolded for pgvector search integration.",
    });
  } catch (error) {
    return failFromError(error);
  }
}
