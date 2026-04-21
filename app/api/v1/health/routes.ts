import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({
    service: "axiom-api",
    status: "ok",
    version: "v1"
  });
}