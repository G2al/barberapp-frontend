import { endpoints } from "@/lib/api/endpoints";

type PushBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  content_encoding: "aesgcm";
};

export async function enablePushNotifications(publicKey: string) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permesso notifiche non concesso.");

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeKey(publicKey),
  });
  await endpoints.subscribePush(subscriptionBody(subscription));
}

export async function disablePushNotifications() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await endpoints.unsubscribePush(subscriptionBody(subscription));
  await subscription.unsubscribe();
}

function decodeKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function subscriptionBody(subscription: PushSubscription): PushBody {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Subscription push non valida.");
  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    content_encoding: "aesgcm",
  };
}
