import type {
  HealthCheck,
  HealthReport,
  HealthReportStatus,
} from "@/server/health/contracts";

export function buildHealthReport(input: {
  checks: HealthCheck[];
  generatedAt?: Date;
  service?: string;
  version?: string;
}): HealthReport {
  const status: HealthReportStatus = input.checks.every(
    (check) => check.status === "ok",
  )
    ? "healthy"
    : "degraded";

  return {
    checks: input.checks,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    service: input.service ?? "axiom-api",
    status,
    version: input.version ?? "v1",
  };
}
