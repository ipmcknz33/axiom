export type AgentRiskLevel = "low" | "medium" | "high" | "critical";

export type AgentTemplate = {
  id: string;
  name: string;
  description: string;
  allowedTools: string[];
  memoryScope: "conversation" | "project" | "organization";
  requiresApprovalFor: string[];
  riskLevel: AgentRiskLevel;
};

export type ConnectorTemplate = {
  id: string;
  provider: string;
  category:
    | "communication"
    | "productivity"
    | "finance"
    | "research"
    | "custom";
  scopes: string[];
  isHighRisk: boolean;
};

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApprovalRecord = {
  id: string;
  action: string;
  createdAt: string;
  reason: string | null;
  requesterUserId: string | null;
  resourceId: string | null;
  resourceType: string | null;
  status: ApprovalStatus;
};

export type AuditLogRecord = {
  action: string;
  actorId: string | null;
  actorType: string;
  createdAt: string;
  id: string;
  metadata: Record<string, unknown>;
  outcome: string;
  targetId: string | null;
  targetType: string | null;
};
