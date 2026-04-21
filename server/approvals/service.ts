import type { ApprovalRecord } from "@/types/domain";
import {
  insertApproval,
  listApprovals,
  type ApprovalRow,
  type CreateApprovalRowInput,
} from "@/server/approvals/repository";

export type CreateApprovalInput = CreateApprovalRowInput;

function mapApprovalRow(row: ApprovalRow): ApprovalRecord {
  return {
    action: row.action,
    createdAt: row.created_at,
    id: row.id,
    reason: row.reason,
    requesterUserId: row.requester_user_id,
    resourceId: row.resource_id,
    resourceType: row.resource_type,
    status: row.status as ApprovalRecord["status"],
  };
}

export async function createApprovalRequest(
  input: CreateApprovalInput,
): Promise<ApprovalRecord> {
  const row = await insertApproval(input);
  return mapApprovalRow(row);
}

export async function listApprovalQueue(filters: {
  requesterUserId?: string;
}): Promise<ApprovalRecord[]> {
  const rows = await listApprovals(filters.requesterUserId);
  return rows.map(mapApprovalRow);
}
