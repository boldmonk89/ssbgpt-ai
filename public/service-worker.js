/**
 * SSB GPT — Service Worker v3
 * Runtime caching for Vite hashed assets + offline fallback
 */

const CACHE_VERSION = 'v3.0.0';
const APP_CACHE    = `ssbgpt-app-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Install — cache only the offline fallback (Vite assets have hashed names, cache at runtime)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll([OFFLINE_PAGE]))
      .then(() => self.skipWaiting())
  );
});

// Activate — purge old caches, claim clients, notify about update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== APP_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED' })))
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.startsWith('/~oauth')) return;

  // OAuth routes — always network, never cache
  if (url.pathname.startsWith('/~oauth')) {
    event.respondWith(fetch(request));
    return;
  }

  // API / Supabase — network only, graceful error
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline', fallback: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Navigation (HTML pages) — network first, cache fallback, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(APP_CACHE).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request)
            .then((r) => r || caches.match('/'))
            .then((r) => r || caches.match(OFFLINE_PAGE))
            .then((r) => r || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } }))
        )
    );
    return;
  }

  // All other assets (JS, CSS, images, fonts) — stale-while-revalidate
  // This ensures Vite's hashed bundles get cached on first load
  event.respondWith(
    caches.open(APP_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);
        
        // Return cached immediately if available, otherwise wait for network
        return cached || fetchPromise || new Response('', { status: 503 });
      })
    )
  );
});
