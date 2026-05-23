const CACHE = "rescue-james-dev";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./src/main.js",
  "./assets/fonts/fraunces-latin.woff2",
  "./assets/fonts/nunito-latin.woff2",
  "./assets/sprites/characters.png",
  "./assets/sprites/chomper.png",
  "./assets/sprites/ghostboy.png",
  "./assets/sprites/monsterboy.png",
  "./assets/sprites/ogrebaby.png",
  "./assets/sprites/ogreboss.png",
  "./assets/sprites/coin.png",
  "./assets/sprites/heartblacksun.png",
  "./src/endlessRunner.js",
  "./assets/music/highscoredrive.mp3",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-512.png",
];

const APP_SHELL = new Set([
  "./",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./src/main.js",
]);

function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function cachePathname(url) {
  const path = new URL(url).pathname;
  if (path.endsWith("/")) return `${path}index.html`;
  return path;
}

function isAppShellRequest(request) {
  const path = cachePathname(request.url);
  for (const entry of APP_SHELL) {
    const entryPath = cachePathname(new URL(entry, self.location.href).href);
    if (path === entryPath) return true;
  }
  return request.mode === "navigate";
}

async function putInCache(request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(CACHE);
  await cache.put(request, response);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await putInCache(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const fallback = await caches.match("./index.html");
      if (fallback) return fallback;
    }
    throw new Error("Offline and no cached response");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    await putInCache(request, response.clone());
    return response;
  } catch {
    throw new Error("Offline and no cached response");
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isSameOrigin(request)) return;

  event.respondWith(
    isAppShellRequest(request) ? networkFirst(request) : cacheFirst(request)
  );
});
