import { ok } from "@/lib/api/response";
import { getPublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildHealthReport } from "@/server/health/builder";
import type { HealthCheck } from "@/server/health/contracts";

export async function GET() {
  const checks: HealthCheck[] = [];

  try {
    getPublicEnv();
    checks.push({ name: "env", status: "ok" });
  } catch (error) {
    checks.push({
      name: "env",
      status: "error",
      detail:
        error instanceof Error
          ? error.message
          : "environment validation failed",
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    const queryable = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          limit: (
            count: number,
          ) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
    const { error } = await queryable.from("profiles").select("id").limit(1);

    if (error) {
      checks.push({ name: "database", status: "error", detail: error.message });
    } else {
      checks.push({ name: "database", status: "ok" });
    }
  } catch (error) {
    checks.push({
      name: "database",
      status: "error",
      detail:
        error instanceof Error ? error.message : "database health check failed",
    });
  }

  const report = buildHealthReport({ checks });

  return ok(report, { status: report.status === "healthy" ? 200 : 503 });
}
