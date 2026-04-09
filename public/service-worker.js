/**
 * SSB GPT — Service Worker
 * Strategy: Cache-first for static assets, Network-first for API calls
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE  = `ssbgpt-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ssbgpt-dynamic-${CACHE_VERSION}`;
const API_CACHE     = `ssbgpt-api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', (event) => {
  const allowedCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !allowedCaches.includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
     .then(() => self.clients.matchAll({ type: 'window' }))
     .then((clients) => clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED' })))
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  // Never cache OAuth redirects
  if (url.pathname.startsWith('/~oauth')) return;

  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await Promise.race([
      fetch(request.clone()),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ]);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || new Response(
      JSON.stringify({ error: 'Offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) { const cache = await caches.open(cacheName); cache.put(request, response.clone()); }
    return response;
  } catch { return new Response('Offline', { status: 503 }); }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) { const cache = await caches.open(DYNAMIC_CACHE); cache.put(request, response.clone()); }
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match('/')) || (await caches.match('/offline.html'))
      || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then((r) => { if (r.ok) cache.put(request, r.clone()); return r; }).catch(() => null);
  return cached || await networkFetch || new Response('Offline', { status: 503 });
}

function isStaticAsset(p) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|webp|avif)(\?.*)?$/.test(p);
}
