import { fail, failFromError, ok } from "@/lib/api/response";
import { getAuthContext } from "@/server/security/auth";
import { resolveUserEntitlementState } from "@/server/entitlements/service";

export async function GET(request: Request) {
  try {
    const auth = getAuthContext(request.headers);

    if (!auth.success) {
      return fail(auth.error, 401, "unauthenticated");
    }

    const snapshot = await resolveUserEntitlementState(
      auth.data.userId,
      auth.data.role,
    );

    return ok({ snapshot });
  } catch (error) {
    return failFromError(error);
  }
}
