/**
 * Service Worker — Aplicație Vreme
 * Strategie: Network First pentru API, Cache First pentru assets statice
 */

const CACHE_NAME = 'vreme-v2';
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/styles/style.css',
  '/styles/background-animations.css',
  '/offline.html'
];

const OWM_HOST = 'api.openweathermap.org';
const API_CACHE = 'vreme-api-v1';
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minute

// ── Install ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorăm requesturi non-GET și /api/ backend-ul nostru
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  // OpenWeatherMap — Network First cu cache 5 min
  if (url.hostname === OWM_HOST) {
    event.respondWith(networkFirstWithTTL(request));
    return;
  }

  // Assets statice — Cache First
  event.respondWith(cacheFirst(request));
});

async function networkFirstWithTTL(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Stocăm răspunsul cu timestamp
      const clone = response.clone();
      const headers = new Headers(clone.headers);
      headers.append('sw-cached-at', Date.now().toString());
      const cachedResponse = new Response(await clone.blob(), {
        status: clone.status,
        statusText: clone.statusText,
        headers
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch {
    // Offline — încearcăm din cache
    const cached = await cache.match(request);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
      if (Date.now() - cachedAt < API_CACHE_TTL) return cached;
    }
    return new Response(JSON.stringify({ eroare: 'Offline — date indisponibile' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && response.status < 400) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Fallback la offline.html pentru navigare
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    return new Response('Offline', { status: 503 });
  }
}
