// ============================================
// Smart Shop PWA — Service Worker
// Strategy: Network First with Cache Fallback
// ============================================
const CACHE_NAME = 'ss-cache-v50';
const STATIC_CACHE = 'ss-static-v50';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
];

// ── Install: Pre-cache critical assets ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Silently fail if some assets are unavailable
        console.log('[SW] Pre-cache completed (partial)');
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: Clean old caches ──────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: Network first, cache fallback ────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests — network only (no caching for fresh data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Static assets — cache first (faster load)
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|webp)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation / pages — network first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Everything else — network only
  event.respondWith(networkOnly(request));
});

// ── Strategies ──────────────────────────────────────────────────

/**
 * Network First with Cache Fallback
 * Try network, if fails show cached version
 */
async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // If no cache and offline, return offline page
    return new Response(
      '<html><body style="text-align:center;padding:2rem;font-family:sans-serif">' +
      '<h1>📡 ከኔትወርክ ጋር አልተገናኘም</h1>' +
      '<p>እባክዎ ኢንተርኔትዎን ያረጋግጡ እና እንደገና ይሞክሩ</p>' +
      '<p>Please check your internet connection</p>' +
      '</body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/**
 * Cache First — for static assets (faster)
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/**
 * Network Only — for API calls (always fresh)
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Network offline' }),
      { status: 408, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
