import { api } from "@/lib/api/client";
import { authStorage } from "@/lib/auth/storage";
import { clearPushOwner, ownsPush, PUSH_STATUS_EVENT, readPushOwner, savePushOwner, readPushPreference, savePushPreference } from "./account-state";

let verified = "";
let verification: { key: string; promise: Promise<void> } | null = null;
let changing = false;
let generation = 0;
let detachedSession = "";
const announce = () => window.dispatchEvent(new Event(PUSH_STATUS_EVENT));
const sessionKey = () => JSON.stringify([authStorage.getUser()?.id, authStorage.getToken(), generation]);

async function associate(subscription: PushSubscription, session: string) {
  const key = session + subscription.endpoint;
  if (verified === key) return;
  if (verification?.key === key) return verification.promise;
  const promise = (async () => {
    if (sessionKey() !== session || !authStorage.getToken()) throw new Error("Sessione cambiata. Riprova.");
    const response = await api<{ status?: boolean }>("/push/subscriptions", { method: "POST", body: subscriptionBody(subscription), signal: AbortSignal.timeout(8000) });
    if (response?.status !== true) throw new Error("Il server non ha confermato l’attivazione.");
    if (sessionKey() !== session) throw new Error("Sessione cambiata. Riprova.");
    savePushOwner(String(authStorage.getUser()!.id), subscription.endpoint);
    savePushPreference(String(authStorage.getUser()!.id), true);
    verified = key;
  })();
  verification = { key, promise };
  try { await promise; } finally { if (verification?.promise === promise) verification = null; }
}

export async function hasAccountPush(userId: string) {
  if (changing || !authStorage.getToken() || String(authStorage.getUser()?.id) !== userId || Notification.permission !== "granted") return false;
  const session = sessionKey();
  if (session === detachedSession) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  const preference = readPushPreference(userId);
  if (preference === false) return false;
  if (!subscription) {
    // iOS may require a new gesture if the subscription was removed (e.g. offline logout).
    if (preference === true) {
      try { localStorage.removeItem(`mottolas:push-prompt-decision:v2:${userId}`); } catch { /* Optional storage. */ }
    }
    return false;
  }
  if (preference !== true && !ownsPush(readPushOwner(), userId, subscription.endpoint)) return false;
  // Only reconfirm a subscription explicitly enabled by this user, once per session.
  await associate(subscription, session);
  return !changing && sessionKey() === session;
}

export async function enablePushNotifications(publicKey: string) {
  if (changing) throw new Error("Attendi il completamento dell’operazione in corso.");
  changing = true;
  const session = sessionKey();
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Permesso notifiche non concesso. Controlla le impostazioni del dispositivo.");
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.active) throw new Error("L’app si sta preparando. Riprova tra qualche secondo.");
    if (sessionKey() !== session || !authStorage.getToken()) throw new Error("Accedi nuovamente prima di attivare le notifiche.");
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) });
    verified = "";
    await associate(subscription, session);
  } finally { changing = false; announce(); }
}

export async function disablePushNotifications() {
  if (changing) throw new Error("Attendi il completamento dell’operazione in corso.");
  changing = true;
  const userId = String(authStorage.getUser()?.id);
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await api("/push/subscriptions", { method: "DELETE", body: { endpoint: subscription.endpoint }, signal: AbortSignal.timeout(6000) });
      savePushPreference(userId, false);
      clearPushOwner(); verified = "";
      await subscription.unsubscribe();
    }
    savePushPreference(userId, false);
    clearPushOwner(); verified = "";
  } finally { changing = false; announce(); }
}

export async function detachPushOnLogout() {
  const previousOwner = readPushOwner();
  if (previousOwner?.userId === String(authStorage.getUser()?.id)) {
    // Migrate already-enabled accounts without conflating logout with opt-out.
    if (readPushPreference(previousOwner.userId) !== false) savePushPreference(previousOwner.userId, true);
  }
  ++generation;
  detachedSession = sessionKey();
  verified = ""; clearPushOwner();
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  changing = true;
  try {
    await verification?.promise.catch(() => undefined);
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      try {
        const response = await api<{ status?: boolean }>("/push/subscriptions", { method: "DELETE", body: { endpoint: subscription.endpoint }, signal: AbortSignal.timeout(6000) });
        if (response?.status !== true) throw new Error("Disconnessione push non confermata.");
        // Keep the browser subscription, but no backend delivery while logged out.
        // The consenting account will re-associate it with its new token at login.
      } catch {
        // If server detachment fails, revoke locally to avoid notifications from the old account.
        await subscription.unsubscribe();
      }
    }
  } catch { /* Logout still completes, including when offline. */ }
  finally { verified = ""; clearPushOwner(); changing = false; announce(); }
}

function decodeKey(value: string) {
  const base64 = (value + "=".repeat((4 - value.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}
function subscriptionBody(subscription: PushSubscription) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Sottoscrizione non valida. Riprova ad attivare le notifiche.");
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }, content_encoding: "aesgcm" };
}
