
const CACHE = 'iatrophilic-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

// Install the new service worker and cache essential files.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    await Promise.all(
      ASSETS.map(asset =>
        cache.add(asset).catch(() => null)
      )
    );

    await self.skipWaiting();
  })());
});

// Activate the new worker and remove old Iatrophilic caches.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith('iatrophilic-') && key !== CACHE
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

// Always try the network first; use cached files when offline.
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Don't interfere with external APIs or other websites.
  if (url.origin !== self.location.origin) return;

  // Don't interfere with partial/range requests.
  if (request.headers.has('range')) return;

  const isHTML =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  event.respondWith((async () => {
    try {
      // Bypass the browser's HTTP cache to request fresh content.
      const response = await fetch(request, {
        cache: 'no-store'
      });

      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }

      return response;

    } catch (error) {
      // Network unavailable: use the cached version.
      const cached = await caches.match(request);

      if (cached) return cached;

      // For offline page navigation, fall back to index.html.
      if (isHTML) {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }

      return new Response('You are currently offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  })());
});
