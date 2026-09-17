/* README_32 — shell/static cache only. Never cache /api/v1 JSON. */
const SHELL = "opc-shell-v2";
const STATIC = "opc-static-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(["/", "/manifest.webmanifest"]).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL && k !== STATIC).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/") || url.pathname.includes("/api/v1/")) {
    return; // network-only — never cache commercial API
  }

  // Dev / localhost: never cache Next bundles (dev chunk names are stable → stale JS).
  const isLocal =
    url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname.endsWith(".local");
  if (isLocal) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    // Network-first so hashed production updates are not trapped behind a stale hit.
    event.respondWith(
      fetch(req)
        .then(async (res) => {
          if (res.ok) {
            const cache = await caches.open(STATIC);
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => caches.open(STATIC).then((cache) => cache.match(req)).then((r) => r || fetch(req)))
    );
    return;
  }

  // Navigation / shell: network first, fall back to cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(async (res) => {
          const cache = await caches.open(SHELL);
          cache.put(req, res.clone());
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
  }
});
