import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({ items: [], note: "Task list endpoint scaffolded for Supabase integration." });
}