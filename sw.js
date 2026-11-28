self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request.url, {
      cache: 'no-store',
      credentials: e.request.credentials,
      mode: e.request.mode === 'navigate' ? 'cors' : e.request.mode,
      redirect: e.request.redirect
    })
  );
});
