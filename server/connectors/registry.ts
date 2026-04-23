import { ConnectorTemplate } from "@/types/domain";

const connectorTemplates: ConnectorTemplate[] = [
  {
    id: "workspace-suite",
    provider: "Workspace Suite",
    category: "productivity",
    scopes: ["calendar.read", "gmail.read", "drive.read"],
    isHighRisk: false,
  },
  {
    id: "brokerage-trading",
    provider: "Brokerage API",
    category: "finance",
    scopes: ["positions.read", "trade.execute"],
    isHighRisk: true,
  },
];

export function listConnectorTemplates() {
  return connectorTemplates;
}
