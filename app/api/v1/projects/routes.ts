import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({ items: [], note: "Project list endpoint scaffolded for Supabase integration." });
}