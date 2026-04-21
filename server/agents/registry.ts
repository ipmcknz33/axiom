import { AgentTemplate } from "@/types/domain";

const agentTemplates: AgentTemplate[] = [
  {
    id: "orchestrator-core",
    name: "Orchestrator Core",
    description:
      "Coordinates specialist agents and enforces policy guardrails.",
    allowedTools: ["agent.dispatch", "approval.request", "memory.retrieve"],
    memoryScope: "organization",
    requiresApprovalFor: [
      "connector.execute.finance",
      "production.code_change",
    ],
    riskLevel: "high",
  },
  {
    id: "research-analyst",
    name: "Research Analyst",
    description:
      "Retrieves, verifies, and synthesizes research with source tracking.",
    allowedTools: ["web.search", "memory.retrieve", "document.query"],
    memoryScope: "project",
    requiresApprovalFor: [],
    riskLevel: "medium",
  },
];

export function listAgentTemplates() {
  return agentTemplates;
}
