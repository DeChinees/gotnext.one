const CACHE_VERSION = 'v1';
const CACHE_NAME = `gotnext-cache-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';
const PRE_CACHE_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/gotnext.icon.png',
  '/gotnext.icon.bw.png',
  '/gotnext.logo.white.png',
  '/gotnext.logo.black.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.all(
        PRE_CACHE_ASSETS.map(async (asset) => {
          try {
            const request = new Request(asset, { cache: 'reload' });
            const response = await fetch(request);
            if (response.ok) {
              await cache.put(request, response.clone());
            }
          } catch (error) {
            console.warn('[sw] Failed to pre-cache asset', asset, error);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key.startsWith('gotnext-cache-')) {
            return caches.delete(key);
          }
          return undefined;
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(request.url);

  if (requestURL.origin !== self.location.origin) {
    return;
  }

  if (requestURL.pathname.startsWith('/api/')) {
    return;
  }

  const isStaticAsset =
    requestURL.pathname.startsWith('/_next/static/') ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font';

  const cacheStrategy = async () => {
    const cache = await caches.open(CACHE_NAME);

    if (isStaticAsset) {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        return cached;
      }
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.ok && requestURL.pathname !== OFFLINE_URL) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      if (request.mode === 'navigate') {
        const offlineResponse = await cache.match(OFFLINE_URL);
        if (offlineResponse) {
          return offlineResponse;
        }
      }

      throw error;
    }
  };

  event.respondWith(cacheStrategy());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
