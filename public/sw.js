// Service Worker for Portadora Admin PWA
// Optimizado para Android (Xiaomi Redmi A3) y offline completo

const CACHE_NAME = 'portadora-admin-v2';
const OFFLINE_URL = '/admin';

// Assets to cache on install - CRITICAL for offline
const PRECACHE_URLS = [
  '/',
  '/admin',
  '/admin/calendario',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache core assets
globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets');
      return cache.addAll(PRECACHE_URLS);
    }).catch((err) => {
      console.log('[SW] Pre-cache failed:', err);
    })
  );
  globalThis.skipWaiting();
});

// Activate event - clean old caches
globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return globalThis.clients.claim();
    })
  );
});

// Fetch event - network first with cache fallback
globalThis.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except for fonts, etc)
  if (url.origin !== location.origin) return;

  // Determine request type
  const isPageRequest = request.mode === 'navigate' || 
    url.pathname.startsWith('/admin') || 
    url.pathname === '/';
  
  const isNextStatic = url.pathname.startsWith('/_next/static') || 
    url.pathname.startsWith('/_next/data');
  
  const isImage = url.pathname.includes('/icons/') || 
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico');

  const isFont = url.pathname.includes('/fonts/') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2');

  // Handle different request types
  if (isNextStatic || isImage || isFont) {
    // Cache-First: check cache first, then network
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cached, update in background
          fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
              }
            })
            .catch(() => {});
          return cached;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => null);
      })
    );
  } else if (isPageRequest) {
    // Network-First for pages (ensures fresh content)
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: try cache, then offline page
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match(OFFLINE_URL);
          });
        })
    );
  } else {
    // Stale-While-Revalidate for API and other requests
    event.respondWith(
      caches.match(request).then((cached) => {
        const networked = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached ?? networked;
      })
    );
  }
});

// Push notification handler
globalThis.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Portadora Admin';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: data.url || '/admin',
    vibrate: [200, 100, 200],
    tag: 'portadora-notification',
    renotify: true,
  };
  
  event.waitUntil(
    globalThis.registration.showNotification(title, options)
  );
});

// Notification click handler
globalThis.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/admin';
  event.waitUntil(
    clients.openWindow(url)
  );
});

// Background sync for offline actions (if needed)
globalThis.addEventListener('sync', (event) => {
  if (event.tag === 'sync-appointments') {
    console.log('[SW] Background sync triggered');
  }
});
