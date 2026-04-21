import { ok } from "@/lib/api/response";
import { listConnectorTemplates } from "@/server/connectors/registry";

export async function GET() {
  return ok({ templates: listConnectorTemplates() });
}