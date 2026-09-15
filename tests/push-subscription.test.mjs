import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/push/notifications.ts", import.meta.url), "utf8");
let run = 0;
async function setup() {
  let user = "1", owner = null, failure = false, subscription = null;
  const calls = [];
  const item = { endpoint: "https://push.apple.com/test", toJSON: () => ({ endpoint: item.endpoint, keys: { p256dh: "key", auth: "auth" } }), unsubscribe: async () => { subscription = null; return true; } };
  const registration = { active: true, pushManager: { getSubscription: async () => subscription, subscribe: async () => { subscription = item; return item; } } };
  globalThis.window = Object.assign(new EventTarget(), { PushManager: function () {} });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { serviceWorker: { getRegistration: async () => registration } } });
  globalThis.Notification = { permission: "granted", requestPermission: async () => "granted" };
  globalThis.localStorage = { removeItem() {} };
  globalThis.__pushMocks = {
    api: async (url, options) => { calls.push({ url, ...options, user }); if (failure) throw new Error("Offline"); return { status: true }; },
    authStorage: { getUser: () => ({ id: user }), getToken: () => "token-" + user },
    clearPushOwner: () => { owner = null; }, readPushOwner: () => owner,
    savePushOwner: (userId, endpoint) => { owner = { userId, endpoint }; },
    ownsPush: (value, id, endpoint) => value?.userId === id && value?.endpoint === endpoint,
    PUSH_STATUS_EVENT: "test-push",
  };
  const withoutImports = source.replace(/^import .*;\r?\n/gm, "");
  const js = ts.transpileModule(withoutImports, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  const prefix = "const {api,authStorage,clearPushOwner,readPushOwner,savePushOwner,ownsPush,PUSH_STATUS_EVENT} = globalThis.__pushMocks;\n";
  const mod = await import("data:text/javascript;base64," + Buffer.from(prefix + js + `\n// run ${run++}`).toString("base64"));
  return { mod, calls, changeUser: value => { user = value; }, fail: () => { failure = true; }, owner: () => owner, existing: () => { subscription = item; }, subscribed: () => !!subscription };
}
test("existing browser subscription does not silently activate a new account", async () => {
  const x = await setup(); x.existing();
  assert.equal(await x.mod.hasAccountPush("1"), false);
  assert.equal(x.calls.length, 0);
});
test("activation associates the current account only after successful POST", async () => {
  const x = await setup(); x.existing();
  await x.mod.enablePushNotifications("AQ");
  assert.equal(await x.mod.hasAccountPush("1"), true);
  assert.equal(x.calls.length, 1);
  x.changeUser("2");
  assert.equal(await x.mod.hasAccountPush("2"), false);
  await x.mod.enablePushNotifications("AQ");
  assert.equal(x.owner().userId, "2");
  assert.equal(x.calls[1].user, "2");
});
test("failed registration never acknowledges activation", async () => {
  const x = await setup(); x.fail();
  await assert.rejects(x.mod.enablePushNotifications("AQ"));
  assert.equal(x.owner(), null);
  assert.equal(await x.mod.hasAccountPush("1"), false);
});
test("logout removes server association and browser subscription", async () => {
  const x = await setup(); await x.mod.enablePushNotifications("AQ");
  await x.mod.detachPushOnLogout();
  assert.equal(x.owner(), null);
  assert.equal(x.subscribed(), false);
  assert.equal(x.calls.at(-1).method, "DELETE");
});
test("offline logout still clears the browser subscription and acknowledgement", async () => {
  const x = await setup(); await x.mod.enablePushNotifications("AQ"); x.fail();
  await x.mod.detachPushOnLogout();
  assert.equal(x.owner(), null);
  assert.equal(x.subscribed(), false);
});
