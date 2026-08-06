// ============================================
// Smart Shop — Service Worker (v92 - NETWORK FIRST)
// Enables PWA install on Android & iOS
// Strategy: NETWORK-FIRST for 100% freshness, cache fallback offline
// ============================================

const CACHE_NAME = 'ss-cache-v92-netfirst';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install: pre-cache critical assets ────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately without waiting for page reload
  self.skipWaiting();
});

// ── Activate: delete ALL old caches immediately ──────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ── Fetch: NETWORK FIRST for all requests ─────────────────────
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls (always go to network)
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Skip Telegram WebApp requests
  if (event.request.url.includes('telegram')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ALL GET requests: Network first, fallback to cache if offline
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful valid responses for offline fallback
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});
