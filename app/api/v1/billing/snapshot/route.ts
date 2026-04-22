import { fail, failFromError, ok } from "@/lib/api/response";
import { getAuthContext } from "@/server/security/auth";
import { getBillingSnapshotForUser } from "@/server/billing/service";

export async function GET(request: Request) {
  try {
    const auth = getAuthContext(request.headers);

    if (!auth.success) {
      return fail(auth.error, 401, "unauthenticated");
    }

    const snapshot = await getBillingSnapshotForUser(auth.data.userId);
    return ok({ snapshot });
  } catch (error) {
    return failFromError(error);
  }
}
