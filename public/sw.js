const SHELL_CACHE = "delpiano-shell-v1";
self.addEventListener("install", (event) => event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add("/offline")).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(Promise.all([caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key)))), self.clients.claim()])));
self.addEventListener("fetch", (event) => { if (event.request.mode === "navigate") event.respondWith(fetch(event.request).catch(() => caches.match("/offline"))); });
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json?.() ?? {}; } catch { data = { body: event.data?.text?.() }; }
  const tag = data.tag ?? (data.booking_id ? `booking-${data.booking_id}` : "delpiano-update");
  event.waitUntil(self.registration.showNotification(data.title ?? "Del Piano Luxury", {
    body: data.body ?? "Hai un nuovo aggiornamento.",
    icon: "/del-piano-icon.png",
    tag,
    renotify: true,
    timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
    data: { url: data.url ?? (data.booking_id ? "/prenotazioni" : "/home") },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url ?? "/home", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
    const current = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (current) {
      if ("navigate" in current) await current.navigate(targetUrl);
      current.postMessage({ type: "REFRESH_APPOINTMENTS" });
      return current.focus();
    }
    return self.clients.openWindow(targetUrl);
  }));
});
