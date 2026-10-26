/* Archē portal service worker: shows alerts on the phone or computer, even with the portal closed (Morten, 26 Oct 2026).
   It caches nothing; the portal always loads fresh. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Archē Executive", { body: d.body || "", tag: d.tag || "arche", renotify: true, requireInteraction: true, icon: "/img/arche-icon-192.png", badge: "/img/arche-icon-192.png", data: { url: d.url || "/" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data || {}).url || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => { for (const w of ws) if ("focus" in w) return w.focus(); return self.clients.openWindow(url); }));
});
