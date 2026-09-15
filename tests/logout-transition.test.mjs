import test from "node:test";
import assert from "node:assert/strict";
import { runLogoutTransition } from "../src/lib/auth/logout-transition.ts";

test("successful logout finishes both phases and navigates exactly once", async () => {
  const events = [];
  await runLogoutTransition({ logout: async () => { events.push("logout"); }, signal: new AbortController().signal, phase: value => events.push(value), navigate: () => events.push("login"), durations: [0, 0, 0] });
  assert.deepEqual(events, ["logout", "complete", "exit", "login"]);
});
test("leaving during logout prevents delayed phases and redirect", async () => {
  const events = [], controller = new AbortController();
  let finish;
  const task = runLogoutTransition({ logout: () => new Promise(resolve => { finish = resolve; }), signal: controller.signal, phase: value => events.push(value), navigate: () => events.push("login"), durations: [0, 0, 0] });
  controller.abort(); finish(); await task;
  assert.deepEqual(events, []);
});
for (const interruptedPhase of ["complete", "exit"]) {
  test(`leaving during ${interruptedPhase} cannot return registration to login`, async () => {
    const events = [], controller = new AbortController();
    await runLogoutTransition({ logout: async () => {}, signal: controller.signal, phase: value => { events.push(value); if (value === interruptedPhase) controller.abort(); }, navigate: () => events.push("login"), durations: [0, 0, 0] });
    assert.equal(events.includes("login"), false);
  });
}
test("logout API failure still completes local logout transition", async () => {
  let redirects = 0;
  await runLogoutTransition({ logout: async () => { throw new Error("Offline"); }, signal: new AbortController().signal, phase: () => {}, navigate: () => redirects++, durations: [0, 0, 0] });
  assert.equal(redirects, 1);
});
