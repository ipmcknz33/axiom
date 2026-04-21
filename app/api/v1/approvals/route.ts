import { fail, failFromError, ok } from "@/lib/api/response";
import { listApprovalQueue } from "@/server/approvals/service";
import { canReadApprovalsQueue } from "@/server/security/approvals-access";
import { getAuthContext } from "@/server/security/auth";

export async function GET(request: Request) {
  try {
    const auth = getAuthContext(request.headers);

    if (!auth.success) {
      return fail(auth.error, 401);
    }

    const requestedUserId = new URL(request.url).searchParams.get("userId");

    const access = canReadApprovalsQueue({
      actor: auth.data,
      requestedUserId: requestedUserId ?? undefined,
    });

    if (!access.allowed) {
      return fail(access.message, access.status, access.code);
    }

    const items = await listApprovalQueue({
      requesterUserId: access.effectiveRequesterUserId,
    });

    return ok({ items });
  } catch (error) {
    return failFromError(error);
  }
}
