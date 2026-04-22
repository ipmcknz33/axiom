"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const builder_1 = require("../server/health/builder");
(0, node_test_1.default)("health report is healthy when all checks are ok", () => {
    const report = (0, builder_1.buildHealthReport)({
        checks: [
            { name: "env", status: "ok" },
            { name: "database", status: "ok" },
        ],
    });
    strict_1.default.equal(report.status, "healthy");
});
(0, node_test_1.default)("health report is degraded when any check fails", () => {
    const report = (0, builder_1.buildHealthReport)({
        checks: [
            { name: "env", status: "ok" },
            { name: "database", status: "error", detail: "connection timeout" },
        ],
    });
    strict_1.default.equal(report.status, "degraded");
});
