import assert from "node:assert/strict";
import test from "node:test";

import { canReadApprovalsQueue } from "../server/security/approvals-access";

test("user reads own approvals queue", () => {
  const result = canReadApprovalsQueue({
    actor: { role: "user", userId: "11111111-1111-4111-8111-111111111111" },
    requestedUserId: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(result.allowed, true);

  if (result.allowed) {
    assert.equal(
      result.effectiveRequesterUserId,
      "11111111-1111-4111-8111-111111111111",
    );
  }
});

test("user cannot read another user's queue", () => {
  const result = canReadApprovalsQueue({
    actor: { role: "user", userId: "11111111-1111-4111-8111-111111111111" },
    requestedUserId: "22222222-2222-4222-8222-222222222222",
  });

  assert.equal(result.allowed, false);

  if (!result.allowed) {
    assert.equal(result.code, "approvals_queue_forbidden");
    assert.equal(result.status, 403);
  }
});

test("admin can read any approvals queue", () => {
  const result = canReadApprovalsQueue({
    actor: { role: "admin", userId: "11111111-1111-4111-8111-111111111111" },
    requestedUserId: "22222222-2222-4222-8222-222222222222",
  });

  assert.equal(result.allowed, true);

  if (result.allowed) {
    assert.equal(
      result.effectiveRequesterUserId,
      "22222222-2222-4222-8222-222222222222",
    );
  }
});

test("admin without query reads all approvals", () => {
  const result = canReadApprovalsQueue({
    actor: { role: "admin", userId: "11111111-1111-4111-8111-111111111111" },
  });

  assert.equal(result.allowed, true);

  if (result.allowed) {
    assert.equal(result.effectiveRequesterUserId, undefined);
  }
});
