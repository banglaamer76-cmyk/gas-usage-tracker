// GasMate service worker.
// - Pages: network first, falling back to the cached app shell when offline.
// - Build assets (/_next/static, content-hashed): cache first.
// - Icons and the manifest: served from cache, refreshed in the background.
// - /api/*: never cached. Timer state and sign-in always come from the network.
// Bump VERSION when changing this file's caching logic.
const VERSION = "gasmate-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const SHELL_URL = "/";
const MAX_ASSETS = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      const response = await fetch(SHELL_URL, { cache: "reload" });
      if (response.ok) {
        await shell.put(SHELL_URL, response.clone());
        await cacheShellAssets(await response.text());
      }
      const assets = await caches.open(ASSET_CACHE);
      await assets.addAll(["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => !name.startsWith(VERSION)).map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
  } else if (/\.(?:png|svg|ico|webmanifest)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event));
  }
});

async function handleNavigation(event) {
  try {
    const response = await fetch(event.request);
    // Every screen lives on "/", so keep the latest copy of it (and its assets) for offline use.
    if (response.ok && new URL(event.request.url).pathname === SHELL_URL) {
      const copy = response.clone();
      event.waitUntil(
        (async () => {
          const shell = await caches.open(SHELL_CACHE);
          await shell.put(SHELL_URL, copy.clone());
          await cacheShellAssets(await copy.text());
        })()
      );
    }
    return response;
  } catch {
    const cached = await caches.match(SHELL_URL);
    return cached ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const assets = await caches.open(ASSET_CACHE);
    await assets.put(request, response.clone());
    trimCache(ASSET_CACHE, MAX_ASSETS);
  }
  return response;
}

async function staleWhileRevalidate(event) {
  const assets = await caches.open(ASSET_CACHE);
  const cached = await assets.match(event.request);
  const refresh = fetch(event.request)
    .then((response) => {
      if (response.ok) assets.put(event.request, response.clone());
      return response;
    })
    .catch(() => cached ?? Response.error());
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  return refresh;
}

/** Caches the scripts, styles and fonts an HTML page references, so it can start offline. */
async function cacheShellAssets(html) {
  const urls = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? []);
  const assets = await caches.open(ASSET_CACHE);
  await Promise.all(
    [...urls].map(async (url) => {
      if (await assets.match(url)) return;
      try {
        await assets.add(url);
      } catch {
        // A missing asset shouldn't stop the rest from being cached.
      }
    })
  );
}

async function trimCache(name, maxEntries) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  // Keys come back oldest first, so this drops assets from previous builds.
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)));
}
