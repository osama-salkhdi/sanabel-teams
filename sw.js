// خدمة بسيطة للتطبيق: الشبكة أولاً (حتى تصل التحديثات فوراً) والنسخة المحفوظة عند انقطاع الإنترنت
const CACHE = "sanabel-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./css/style.css", "./assets/emblem.png", "./assets/icons/icon-192.png"]).catch(() => {}))); });
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return; // Supabase والمكتبات الخارجية تمر مباشرة
  e.respondWith(fetch(r).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r).then((m) => m || (r.mode === "navigate" ? caches.match("./index.html") : Response.error()))));
});
