import assert from "node:assert/strict";
import test from "node:test";

import { resolveAccessSnapshot } from "../lib/entitlements/access";
import {
  evaluateActiveAccess,
  evaluateFeatureAccess,
} from "../server/entitlements/guards";

test("expired trial produces inactive premium features", () => {
  const snapshot = resolveAccessSnapshot({
    accessStatus: "active",
    plan: "trial",
    role: "member",
    trialEndsAt: "2026-04-20T00:00:00.000Z",
    trialStartedAt: "2026-04-16T00:00:00.000Z",
    userId: "11111111-1111-4111-8111-111111111111",
    now: new Date("2026-04-22T00:00:00.000Z"),
  });

  assert.equal(snapshot.plan, "free");
  assert.equal(snapshot.trialExpired, true);
  assert.equal(snapshot.features["connectors.premium"], false);
});

test("owner role bypass keeps premium capability", () => {
  const snapshot = resolveAccessSnapshot({
    accessStatus: "active",
    plan: "free",
    role: "owner",
    userId: "11111111-1111-4111-8111-111111111111",
  });

  const decision = evaluateFeatureAccess(snapshot, "memory.long_term");
  assert.equal(decision.allowed, true);
});

test("inactive account is denied by active-access guard", () => {
  const snapshot = resolveAccessSnapshot({
    accessStatus: "inactive",
    plan: "pro",
    role: "member",
    userId: "11111111-1111-4111-8111-111111111111",
  });

  const decision = evaluateActiveAccess(snapshot);
  assert.equal(decision.allowed, false);
  if (!decision.allowed) {
    assert.equal(decision.code, "entitlement_access_inactive");
    assert.equal(decision.status, 403);
  }
});
