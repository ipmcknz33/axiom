import type { AuthContext } from "@/server/security/auth";

export type ApprovalsQueueAccessInput = {
  actor: AuthContext;
  requestedUserId?: string;
};

export type ApprovalsQueueAccessResult =
  | {
      allowed: true;
      effectiveRequesterUserId?: string;
    }
  | {
      allowed: false;
      code: string;
      message: string;
      status: number;
    };

export function canReadApprovalsQueue(
  input: ApprovalsQueueAccessInput,
): ApprovalsQueueAccessResult {
  if (!input.requestedUserId) {
    return {
      allowed: true,
      effectiveRequesterUserId:
        input.actor.role === "admin" ? undefined : input.actor.userId,
    };
  }

  if (input.requestedUserId === input.actor.userId) {
    return {
      allowed: true,
      effectiveRequesterUserId: input.requestedUserId,
    };
  }

  if (input.actor.role === "admin") {
    return {
      allowed: true,
      effectiveRequesterUserId: input.requestedUserId,
    };
  }

  return {
    allowed: false,
    code: "approvals_queue_forbidden",
    message: "Approval queue access is limited to the owner or an admin.",
    status: 403,
  };
}
