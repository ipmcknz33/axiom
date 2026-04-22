"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHealthReport = buildHealthReport;
function buildHealthReport(input) {
    const status = input.checks.every((check) => check.status === "ok")
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
