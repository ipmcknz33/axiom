export type HealthCheckStatus = "ok" | "error";

export type HealthCheck = {
  detail?: string;
  name: "env" | "database";
  status: HealthCheckStatus;
};

export type HealthReportStatus = "healthy" | "degraded";

export type HealthReport = {
  checks: HealthCheck[];
  generatedAt: string;
  service: string;
  status: HealthReportStatus;
  version: string;
};
