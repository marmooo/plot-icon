const CACHE_NAME = "2024-01-07 14:50";
const urlsToCache = [
  "/number-icon/",
  "/number-icon/index.js",
  "/number-icon/mp3/boyon1.mp3",
  "/number-icon/mp3/pa1.mp3",
  "/number-icon/mp3/papa1.mp3",
  "/number-icon/mp3/levelup1.mp3",
  "/number-icon/favicon/favicon.svg",
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
