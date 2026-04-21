import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const RUN_LIVE_TESTS = process.env.RUN_LIVE_SUPABASE_TESTS === "true";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

test("integration: supabase setup", { skip: !RUN_LIVE_TESTS }, async () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.log(
      "⊙ Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
    );
    return;
  }
  console.log("✓ Supabase integration tests ENABLED");
});

test(
  "persistence: insert approval record to database",
  { skip: !RUN_LIVE_TESTS || !SUPABASE_URL || !SERVICE_ROLE_KEY },
  async () => {
    const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
    const testData = {
      action: "test_action",
      reason: "Integration test",
      requester_user_id: "test-user-123",
      resource_id: "conversation-456",
      resource_type: "conversation",
      status: "pending",
      metadata: { test: true },
    };
    const result = await (client.from("approvals") as any).insert([testData]);
    assert.equal(result.error, null, `Insert error: ${result.error?.message}`);
  },
);

test(
  "persistence: list approval records from database",
  { skip: !RUN_LIVE_TESTS || !SUPABASE_URL || !SERVICE_ROLE_KEY },
  async () => {
    const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
    const result = await (client.from("approvals") as any).select("*");
    assert.equal(result.error, null);
  },
);

test(
  "persistence: insert audit log record to database",
  { skip: !RUN_LIVE_TESTS || !SUPABASE_URL || !SERVICE_ROLE_KEY },
  async () => {
    const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
    const testData = {
      actor_type: "user",
      actor_id: "test-user-789",
      action: "test.action",
      outcome: "allowed",
      resource_path: "/api/v1/chat",
      metadata: { test: true },
    };
    const result = await (client.from("audit_logs") as any).insert([testData]);
    assert.equal(result.error, null);
  },
);

test(
  "health: database connectivity check via profiles query",
  { skip: !RUN_LIVE_TESTS || !SUPABASE_URL || !SERVICE_ROLE_KEY },
  async () => {
    const client = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
    const result = await (client.from("profiles") as any).select("id").limit(1);
    assert.equal(result.error, null);
  },
);
