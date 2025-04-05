const CACHE_NAME = "2025-04-06 01:35";
const urlsToCache = [
  "/plot-icon/",
  "/plot-icon/index.js",
  "/plot-icon/mp3/boyon1.mp3",
  "/plot-icon/mp3/pa1.mp3",
  "/plot-icon/mp3/papa1.mp3",
  "/plot-icon/mp3/levelup1.mp3",
  "/plot-icon/favicon/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
