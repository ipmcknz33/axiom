import assert from "node:assert/strict";
import test from "node:test";

import { evaluateChatAccess } from "../server/security/chat-access";

test("allows matching user ownership without requested action", () => {
  const result = evaluateChatAccess({
    actor: { role: "user", userId: "11111111-1111-4111-8111-111111111111" },
    payloadUserId: "11111111-1111-4111-8111-111111111111",
    requiresApprovalForRequestedAction: false,
  });

  assert.equal(result.allowed, true);
});

test("denies ownership mismatch", () => {
  const result = evaluateChatAccess({
    actor: { role: "user", userId: "11111111-1111-4111-8111-111111111111" },
    payloadUserId: "22222222-2222-4222-8222-222222222222",
    requiresApprovalForRequestedAction: false,
  });

  assert.equal(result.allowed, false);

  if (!result.allowed) {
    assert.equal(result.code, "chat_user_mismatch");
    assert.equal(result.status, 403);
  }
});

test("denies service role initiating high-risk approval workflow", () => {
  const result = evaluateChatAccess({
    actor: { role: "service", userId: "11111111-1111-4111-8111-111111111111" },
    payloadUserId: "11111111-1111-4111-8111-111111111111",
    requestedAction: "production.code_change",
    requiresApprovalForRequestedAction: true,
  });

  assert.equal(result.allowed, false);

  if (!result.allowed) {
    assert.equal(result.code, "approval_initiation_forbidden");
    assert.equal(result.status, 403);
  }
});

test("allows user role initiating high-risk approval workflow", () => {
  const result = evaluateChatAccess({
    actor: { role: "user", userId: "11111111-1111-4111-8111-111111111111" },
    payloadUserId: "11111111-1111-4111-8111-111111111111",
    requestedAction: "production.code_change",
    requiresApprovalForRequestedAction: true,
  });

  assert.equal(result.allowed, true);
});
