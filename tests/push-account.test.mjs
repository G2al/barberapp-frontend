import test from "node:test";
import assert from "node:assert/strict";
import { ownsPush, shouldOfferPush } from "../src/lib/push/account-state.ts";

test("subscription belongs to the account AND the current endpoint", () => {
  const owner = { userId: "1", endpoint: "device-a" };
  assert.equal(ownsPush(owner, "1", "device-a"), true);
  assert.equal(ownsPush(owner, "2", "device-a"), false);
  assert.equal(ownsPush(owner, "1", "device-b"), false);
  assert.equal(ownsPush(null, "1", "device-a"), false);
});
const eligible = { checked: true, supported: true, active: false, permission: "default", enabled: true, decided: false };
test("new account is offered activation even with Apple permission already granted", () => {
  assert.equal(shouldOfferPush(eligible), true);
  assert.equal(shouldOfferPush({ ...eligible, permission: "granted" }), true);
});
test("decisions, active subscriptions and denied permission suppress onboarding", () => {
  for (const change of [{ decided: true }, { active: true }, { permission: "denied" }, { checked: false }, { supported: false }, { enabled: false }]) assert.equal(shouldOfferPush({ ...eligible, ...change }), false);
});
test("failed activation remains eligible without a completed decision", () => {
  assert.equal(shouldOfferPush({ ...eligible, permission: "granted", active: false, decided: false }), true);
});
