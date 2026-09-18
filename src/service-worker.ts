// Service Worker for MMD Web Studio PWA
const CACHE_NAME = 'mmd-web-studio-v1';
const ASSET_CACHE_NAME = 'mmd-assets-v1';

// Files to cache for offline use
const OFFLINE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// MMD file extensions to cache
const MMD_EXTENSIONS = ['.pmx', '.bpmx', '.zip', '.vmd', '.vpd', '.mp3', '.wav', '.ogg', '.png', '.jpg', '.jpeg'];

// Install service worker
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_FILES);
    })
  );
});

// Activate service worker
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== ASSET_CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
});

// Fetch handler with caching strategy
self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Check if this is an MMD asset
  const isMMDAsset = MMD_EXTENSIONS.some(ext => url.pathname.toLowerCase().endsWith(ext));

  if (isMMDAsset) {
    // Use cache-first strategy for MMD assets
    event.respondWith(
      caches.open(ASSET_CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((response) => {
            // Clone and cache the response
            const responseClone = response.clone();
            cache.put(request, responseClone);
            return response;
          });
        });
      })
    );
  } else {
    // Use network-first strategy for other files
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((response) => {
          return response || caches.match('/index.html');
        });
      })
    );
  }
});

// Listen for messages from the client
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});

export {};
