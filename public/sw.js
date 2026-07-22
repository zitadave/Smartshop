// Smart Shop Service Worker v3 — Offline-first PWA
const CACHE = 'smartshop-v3';
const STATIC_CACHE = 'smartshop-static-v3';
const API_CACHE = 'smartshop-api-v3';
const STATIC_ASSETS = ['/', '/index.html', '/offline.html'];

// Install: cache shell and show offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== CACHE && k !== API_CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Helper: network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

// Helper: cache-first strategy
async function cacheFirst(request, cacheName, maxAge = 86400000) {
  const cached = await caches.match(request);
  if (cached) {
    const age = Date.now() - new Date(cached.headers.get('date') || 0).getTime();
    if (age < maxAge) return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || new Response('Offline', { status: 503 });
  }
}

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network-first with cache fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase') || url.hostname.includes('vercel')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets: cache-first for 7 days
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, 604800000));
    return;
  }

  // Images: cache-first for 30 days
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHE, 2592000000));
    return;
  }

  // Navigation / pages: network-first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request, CACHE));
});
