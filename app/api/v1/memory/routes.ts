import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({ items: [], note: "Memory retrieval endpoint scaffolded for pgvector search integration." });
}