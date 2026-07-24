// Smart Shop Service Worker v6 — Fast-refresh PWA (cache-bust)
const CACHE = 'smartshop-v6';
const STATIC_CACHE = 'smartshop-static-v6';
const API_CACHE = 'smartshop-api-v6';
const STATIC_ASSETS = ['/', '/index.html', '/offline.html'];

// Install: cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== CACHE && k !== API_CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first: always try network, fall back to cache
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
    if (request.mode === 'navigate') return caches.match('/offline.html');
    return new Response('Offline', { status: 503 });
  }
}

// Network-only for JS/CSS assets - ensures latest code always loads
async function networkOnly(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Not found', { status: 404 });
  }
}

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static JS/CSS assets: NETWORK-ONLY (always get latest)
  if (url.pathname.startsWith('/assets/') && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Images: network-first with short cache
  if (request.destination === 'image') {
    event.respondWith(networkFirst(request, CACHE));
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
