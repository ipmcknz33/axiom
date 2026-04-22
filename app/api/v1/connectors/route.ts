import { failFromError, ok } from "@/lib/api/response";
import { listConnectorTemplates } from "@/server/connectors/registry";
import { getEntitlementContext } from "@/server/entitlements/context";
import { assertFeatureAccess } from "@/server/entitlements/guards";
import { resolveUserEntitlementState } from "@/server/entitlements/service";

export async function GET(request: Request) {
  try {
    const ctx = await getEntitlementContext(request);
    const entitlement = await resolveUserEntitlementState(ctx.userId);
    assertFeatureAccess(entitlement, "connectors.premium");
    return ok({ templates: listConnectorTemplates() });
  } catch (error) {
    return failFromError(error);
  }
}
