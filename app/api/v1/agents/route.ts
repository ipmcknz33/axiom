import { ok } from "@/lib/api/response";
import { listAgentTemplates } from "@/server/agents/registry";

export async function GET() {
  return ok({ templates: listAgentTemplates() });
}