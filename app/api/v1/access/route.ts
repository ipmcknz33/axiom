import { fail, failFromError, ok } from "@/lib/api/response";
import { getEntitlementContext } from "@/server/entitlements/context";
import { resolveUserEntitlementState } from "@/server/entitlements/service";

export async function GET(request: Request) {
  try {
    const ctx = await getEntitlementContext(request);

    const queryUserId =
      new URL(request.url).searchParams.get("userId") ?? undefined;

    if (
      queryUserId &&
      queryUserId !== ctx.userId &&
      ctx.roleHint !== "admin" &&
      !ctx.userEmail?.endsWith("@imdev.studio")
    ) {
      return fail(
        "Access snapshot is limited to the owner or an admin.",
        403,
        "access_forbidden",
      );
    }

    const targetUserId = queryUserId ?? ctx.userId;
    const snapshot = await resolveUserEntitlementState(targetUserId);

    return ok({ snapshot });
  } catch (error) {
    return failFromError(error);
  }
}
