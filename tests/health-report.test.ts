import assert from "node:assert/strict";
import test from "node:test";

import { buildHealthReport } from "../server/health/builder";

test("health report is healthy when all checks are ok", () => {
  const report = buildHealthReport({
    checks: [
      { name: "env", status: "ok" },
      { name: "database", status: "ok" },
    ],
  });

  assert.equal(report.status, "healthy");
});

test("health report is degraded when any check fails", () => {
  const report = buildHealthReport({
    checks: [
      { name: "env", status: "ok" },
      { name: "database", status: "error", detail: "connection timeout" },
    ],
  });

  assert.equal(report.status, "degraded");
});
