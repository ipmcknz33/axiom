"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const supabase_js_1 = require("@supabase/supabase-js");
const RUN_LIVE_TESTS = process.env.RUN_LIVE_SUPABASE_TESTS === "true";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
(0, node_test_1.default)("integration: supabase setup", { skip: !RUN_LIVE_TESTS }, async () => {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.log("⊙ Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
        return;
    }
    console.log("✓ Supabase integration tests ENABLED");
});
(0, node_test_1.default)("persistence: insert approval record to database", { skip: !RUN_LIVE_TESTS || !SUPABASE_URL || !SERVICE_ROLE_KEY }, async () => {
    const client = (0, supabase_js_1.createClient)(SUPABASE_URL, SERVICE_ROLE_KEY);
    const testData = {
        action: "test_action",
        reason: "Integration test",
        requester_user_id: "test-user-123",
        resource_id: "conversation-456",
        resource_type: "conversation",
        status: "pending",
        metadata: { test: true },
    };
    const result = await client.from("approvals").insert([testData]);
    strict_1.default.equal(result.error, null, `Insert error: ${result.error?.message}`);
});
(0, node_test_1.default)("persistence: list approval records from database", { skip: !RUN_LIVE_TESTS || !SUPABASE_URL || !SERVICE_ROLE_KEY }, async () => {
    const client = (0, supabase_js_1.createClient)(SUPABASE_URL, SERVICE_ROLE_KEY);
    const result = await client.from("approvals").select("*");
    strict_1.default.equal(result.error, null);
});
(0, node_test_1.default)("persistence: insert audit log record to database", { skip: !RUN_LIVE_TESTS || !SUPABASE_URL || !SERVICE_ROLE_KEY }, async () => {
    const client = (0, supabase_js_1.createClient)(SUPABASE_URL, SERVICE_ROLE_KEY);
    const testData = {
        actor_type: "user",
        actor_id: "test-user-789",
        action: "test.action",
        outcome: "allowed",
        resource_path: "/api/v1/chat",
        metadata: { test: true },
    };
    const result = await client.from("audit_logs").insert([testData]);
    strict_1.default.equal(result.error, null);
});
(0, node_test_1.default)("health: database connectivity check via profiles query", { skip: !RUN_LIVE_TESTS || !SUPABASE_URL || !SERVICE_ROLE_KEY }, async () => {
    const client = (0, supabase_js_1.createClient)(SUPABASE_URL, SERVICE_ROLE_KEY);
    const result = await client.from("profiles").select("id").limit(1);
    strict_1.default.equal(result.error, null);
});
