import type { AuthContext } from "@/server/security/auth";
import { insertAuditLog } from "@/server/audit/repository";

export type AuditDecision = "allowed" | "denied" | "pending_approval";

export type AuditEvent = {
  actor: AuthContext;
  action: string;
  decision: AuditDecision;
  reason?: string;
  requestedAction?: string;
  resource: string;
  userId: string;
};

export async function logAuditEvent(event: AuditEvent) {
  await insertAuditLog(event);
}
