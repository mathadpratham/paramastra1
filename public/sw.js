const CACHE_NAME = "paramastra-v3";

// Core App Shell assets to precache on install
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/icon.svg",
  "/manifest.json"
];

// Install Service Worker and Precache Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Precaching core App Shell");
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate and Clean Up Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests for offline support
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Skip non-GET requests (such as POST APIs or loggers)
  if (event.request.method !== "GET") {
    return;
  }

  // 2. Ignore Chrome extensions, Hot Module Reloading (HMR) sockets, etc.
  if (requestUrl.protocol !== "http:" && requestUrl.protocol !== "https:") {
    return;
  }

  // 3. Handle Client-Side Navigation Routing (Single Page App Fallback)
  // If the request is for a document (webpage) and from our origin, respond with the cached index.html
  if (event.request.mode === "navigate" && requestUrl.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log("[Service Worker] Network failed, serving cached App Shell index.html");
        return caches.match("/index.html");
      })
    );
    return;
  }

  // 4. Cache-First Strategy for Static Assets (Images, Icons, Webfonts)
  const isStaticAsset = 
    requestUrl.pathname.endsWith(".png") ||
    requestUrl.pathname.endsWith(".svg") ||
    requestUrl.pathname.endsWith(".jpg") ||
    requestUrl.pathname.endsWith(".jpeg") ||
    requestUrl.pathname.endsWith(".woff2") ||
    requestUrl.pathname.endsWith(".css") ||
    requestUrl.pathname.includes("/assets/") ||
    event.request.url.includes("fonts.googleapis.com") ||
    event.request.url.includes("fonts.gstatic.com");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve immediately, but update cache in background (Stale-While-Revalidate)
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {/* Ignore background sync failures */});
          
          return cachedResponse;
        }

        // Fetch from network normally and cache a copy
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. Network-First Strategy with Cache Fallback for dynamic feeds and other scripts
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If successful, cache the updated response
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        console.log("[Service Worker] Fetch failed, attempting cached fallback for:", event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If completely offline and card background failed to fetch, return our local golden SVG
          if (requestUrl.pathname.match(/\.(jpg|jpeg|png|svg)/i)) {
            return caches.match("/icon.svg");
          }
        });
      })
  );
});
