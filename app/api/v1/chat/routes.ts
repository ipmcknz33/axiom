import { fail, failFromError, ok } from "@/lib/api/response";
import { createApprovalRequest } from "@/server/approvals/service";
import { validateOrchestratorInput } from "@/server/orchestrator";
import { evaluateChatAccess } from "@/server/security/chat-access";
import { logAuditEvent } from "@/server/security/audit";
import { getAuthContext } from "@/server/security/auth";
import { requiresApproval } from "@/server/security/policy";

export async function POST(request: Request) {
  try {
    const auth = getAuthContext(request.headers);

    if (!auth.success) {
      await logAuditEvent({
        actor: { role: "user", userId: "anonymous" },
        action: "chat.submit",
        decision: "denied",
        reason: auth.error,
        resource: "/api/v1/chat",
        userId: "unknown",
      });
      return fail(auth.error, 401);
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      await logAuditEvent({
        actor: auth.data,
        action: "chat.submit",
        decision: "denied",
        reason: "Request body must be valid JSON.",
        resource: "/api/v1/chat",
        userId: auth.data.userId,
      });
      return fail("Request body must be valid JSON.", 400);
    }

    const result = validateOrchestratorInput(payload);

    if (!result.success) {
      await logAuditEvent({
        actor: auth.data,
        action: "chat.submit",
        decision: "denied",
        reason: result.errors.join(" "),
        resource: "/api/v1/chat",
        userId: auth.data.userId,
      });
      return fail("Invalid chat payload", 422);
    }

    const requiresApprovalForRequestedAction =
      !!result.data.requestedAction &&
      requiresApproval(result.data.requestedAction);

    const access = evaluateChatAccess({
      actor: auth.data,
      payloadUserId: result.data.userId,
      requestedAction: result.data.requestedAction,
      requiresApprovalForRequestedAction,
    });

    if (!access.allowed) {
      await logAuditEvent({
        actor: auth.data,
        action: "chat.submit",
        decision: "denied",
        reason: access.message,
        resource: "/api/v1/chat",
        userId: result.data.userId,
      });
      return fail(access.message, access.status, access.code);
    }

    if (result.data.requestedAction && requiresApprovalForRequestedAction) {
      const approval = await createApprovalRequest({
        action: result.data.requestedAction,
        reason: "Requested action requires approval before execution.",
        requesterUserId: result.data.userId,
        resourceId: result.data.conversationId,
        resourceType: "conversation",
      });

      await logAuditEvent({
        actor: auth.data,
        action: "chat.submit",
        decision: "pending_approval",
        reason: "Requested action requires approval before execution.",
        requestedAction: result.data.requestedAction,
        resource: "/api/v1/chat",
        userId: result.data.userId,
      });

      return ok(
        {
          accepted: true,
          approval: {
            createdAt: approval.createdAt,
            id: approval.id,
            reason: approval.reason,
            status: approval.status,
          },
          conversationId: result.data.conversationId,
          next: "approval.queue",
          requestedAction: result.data.requestedAction,
        },
        { status: 202 },
      );
    }

    await logAuditEvent({
      actor: auth.data,
      action: "chat.submit",
      decision: "allowed",
      requestedAction: result.data.requestedAction,
      resource: "/api/v1/chat",
      userId: result.data.userId,
    });

    return ok({
      accepted: true,
      auth: {
        role: auth.data.role,
        userId: auth.data.userId,
      },
      conversationId: result.data.conversationId,
      next: "orchestrator.dispatch",
      placeholders: ["memory.retrieve", "agent.route", "approval.check"],
      requestedAction: result.data.requestedAction ?? null,
    });
  } catch (error) {
    return failFromError(error);
  }
}
