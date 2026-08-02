self.addEventListener("install", (event) => event.waitUntil(caches.open("barberapp-shell-v1").then((cache) => cache.add("/offline")).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => { if (event.request.mode === "navigate") event.respondWith(fetch(event.request).catch(() => caches.match("/offline"))); });
self.addEventListener("push", (event) => { const data = event.data?.json?.() ?? {}; event.waitUntil(self.registration.showNotification(data.title ?? "BarberApp", { body: data.body ?? "Hai un nuovo aggiornamento.", icon: "/placeholder-avatar.svg", data: { url: data.url ?? "/home" } })); });
self.addEventListener("notificationclick", (event) => { event.notification.close(); event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? "/home")); });
