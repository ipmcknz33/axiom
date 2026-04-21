import { ApiError } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuditEvent } from "@/server/security/audit";
import type { AuditLogRecord } from "@/types/domain";

export type AuditLogRow = {
  action: string;
  actor_id: string | null;
  actor_type: string;
  created_at: string;
  id: string;
  metadata: Record<string, unknown>;
  outcome: string;
  target_id: string | null;
  target_type: string | null;
};

const AUDIT_COLUMNS = [
  "id",
  "actor_type",
  "actor_id",
  "action",
  "target_type",
  "target_id",
  "outcome",
  "metadata",
  "created_at",
].join(", ");

function mapAuditRow(row: AuditLogRow): AuditLogRecord {
  return {
    action: row.action,
    actorId: row.actor_id,
    actorType: row.actor_type,
    createdAt: row.created_at,
    id: row.id,
    metadata: row.metadata,
    outcome: row.outcome,
    targetId: row.target_id,
    targetType: row.target_type,
  };
}

export async function insertAuditLog(
  event: AuditEvent,
): Promise<AuditLogRecord> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        action: event.action,
        actor_id: event.actor.userId,
        actor_type: event.actor.role,
        metadata: {
          reason: event.reason ?? null,
          requestedAction: event.requestedAction ?? null,
          resource: event.resource,
          userId: event.userId,
        },
        outcome: event.decision,
        target_id: event.userId,
        target_type: event.resource,
      })
      .select(AUDIT_COLUMNS)
      .single<AuditLogRow>();

    if (error || !data) {
      throw new Error(error?.message ?? "No audit row returned.");
    }

    return mapAuditRow(data);
  } catch {
    throw new ApiError({
      code: "audit_store_unavailable",
      message: "audit store unavailable",
      status: 503,
      expose: false,
    });
  }
}
