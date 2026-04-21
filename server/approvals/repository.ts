import { ApiError } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ApprovalRow = {
  action: string;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  id: string;
  reason: string | null;
  requester_agent_id: string | null;
  requester_user_id: string | null;
  resource_id: string | null;
  resource_type: string | null;
  risk_score: number | null;
  status: string;
};

export type CreateApprovalRowInput = {
  action: string;
  reason?: string;
  requesterAgentId?: string;
  requesterUserId?: string;
  resourceId?: string;
  resourceType?: string;
  riskScore?: number;
};

const APPROVAL_COLUMNS = [
  "id",
  "action",
  "status",
  "reason",
  "requester_user_id",
  "resource_type",
  "resource_id",
  "approved_by",
  "approved_at",
  "risk_score",
  "requester_agent_id",
  "created_at",
].join(", ");

export async function insertApproval(
  input: CreateApprovalRowInput,
): Promise<ApprovalRow> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("approvals")
      .insert({
        action: input.action,
        reason: input.reason ?? null,
        requester_agent_id: input.requesterAgentId ?? null,
        requester_user_id: input.requesterUserId ?? null,
        resource_id: input.resourceId ?? null,
        resource_type: input.resourceType ?? null,
        risk_score: input.riskScore ?? null,
      })
      .select(APPROVAL_COLUMNS)
      .single<ApprovalRow>();

    if (error || !data) {
      throw new Error(error?.message ?? "No approval row returned.");
    }

    return data;
  } catch {
    throw new ApiError({
      code: "approval_store_unavailable",
      message: "approval store unavailable",
      status: 503,
      expose: false,
    });
  }
}

export async function listApprovals(
  requesterUserId?: string,
): Promise<ApprovalRow[]> {
  try {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("approvals")
      .select(APPROVAL_COLUMNS)
      .order("created_at", { ascending: false });

    if (requesterUserId) {
      query = query.eq("requester_user_id", requesterUserId);
    }

    const { data, error } = await query.returns<ApprovalRow[]>();

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  } catch {
    throw new ApiError({
      code: "approval_store_unavailable",
      message: "approval store unavailable",
      status: 503,
      expose: false,
    });
  }
}
