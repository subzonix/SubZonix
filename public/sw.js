// SubZonix Service Worker
const CACHE_NAME = "subzonix-v1";
const STATIC_ASSETS = ["/", "/dashboard", "/icons/icon-192.png", "/icons/icon-512.png", "/tabicon.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {
                // Silently fail if some assets are not available
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // Only handle GET requests
    if (event.request.method !== "GET") return;

    // Skip cross-origin requests and Firebase/API requests
    const url = new URL(event.request.url);
    if (
        url.origin !== self.location.origin ||
        url.pathname.startsWith("/api/") ||
        url.hostname.includes("firebase") ||
        url.hostname.includes("googleapis")
    ) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const networkFetch = fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === "basic") {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => cached);

            // Return cached version first for speed, then update in background
            return cached || networkFetch;
        })
    );
});
