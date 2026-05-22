const CACHE = "rescue-james-v1";

const PRECACHE = [
  "./",
  "./index.html",
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
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
    )
  );
});
