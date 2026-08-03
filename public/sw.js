const SHELL_CACHE = "lama-shell-v1";
self.addEventListener("install", (event) => event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add("/offline")).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(Promise.all([caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key)))), self.clients.claim()])));
self.addEventListener("fetch", (event) => { if (event.request.mode === "navigate") event.respondWith(fetch(event.request).catch(() => caches.match("/offline"))); });
self.addEventListener("push", (event) => { const data = event.data?.json?.() ?? {}; event.waitUntil(self.registration.showNotification(data.title ?? "Lama", { body: data.body ?? "Hai un nuovo aggiornamento.", icon: "/lama-logo-white.png", data: { url: data.url ?? "/home" } })); });
self.addEventListener("notificationclick", (event) => { event.notification.close(); event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? "/home")); });
