import assert from "node:assert/strict";
import test from "node:test";

import { resolveEntitlements } from "../server/billing/entitlements";

test("free tier usage limits are enforced in snapshot", () => {
  const snapshot = resolveEntitlements({
    actorRole: "user",
    state: {
      overrides: {},
      usage: {},
    },
    userId: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(snapshot.plan, "free");
  assert.equal(snapshot.features["agents.advanced"], false);
  assert.equal(snapshot.limits["messages.monthly"], 500);
});

test("expired trial cleanly downgrades to free", () => {
  const snapshot = resolveEntitlements({
    actorRole: "user",
    now: new Date("2026-04-21T00:00:00.000Z"),
    state: {
      overrides: {},
      subscription: {
        plan: "trial",
        status: "trialing",
        trialEndsAt: "2026-04-20T00:00:00.000Z",
      },
      usage: {},
    },
    userId: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(snapshot.plan, "free");
  assert.equal(snapshot.trialExpired, true);
  assert.equal(snapshot.features["projects.unlimited"], false);
});

test("admin/internal bypass returns internal plan regardless of subscription", () => {
  const snapshot = resolveEntitlements({
    actorRole: "admin",
    state: {
      overrides: {},
      subscription: {
        plan: "free",
        status: "active",
      },
      usage: {},
    },
    userId: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(snapshot.plan, "internal");
  assert.equal(snapshot.features["connectors.premium"], true);
  assert.equal(snapshot.limits["projects.total"], null);
});
