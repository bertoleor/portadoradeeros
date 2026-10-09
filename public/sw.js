const CACHE_NAME = 'portadora-admin-v3';
const ADMIN_OFFLINE_URL = '/admin';

// Solo cachear recursos del admin — NO el sitio público
const PRECACHE_URLS = [
  '/admin',
  '/admin/bienvenida',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache partial fail (ok):', err);
      });
    })
  );
  globalThis.skipWaiting();
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => globalThis.clients.claim())
  );
});

globalThis.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {return;}
  if (url.origin !== globalThis.location.origin) {return;}

  // CRÍTICO: ignorar completamente rutas del sitio público
  // Solo interceptar /admin/* y assets
  const isAdminRoute = url.pathname.startsWith('/admin');
  const isAsset = url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/manifest.json';

  // Si NO es admin ni asset — dejar pasar sin interceptar
  if (!isAdminRoute && !isAsset) {return;}

  if (isAsset) {
    // Cache-first para assets estáticos
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          fetch(request).then((res) => {
            if (res.ok) {
              return caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
            }
            return undefined;
          }).catch(() => {});
          return cached;
        }
        return fetch(request).then((res) => {
          if (res.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          }
          return res;
        }).catch(() => caches.match('/icons/icon-192x192.png'));
      })
    );
    return;
  }

  // Network-first para todas las rutas /admin/*
  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    }).catch(() => {
      // Sin conexión: servir desde cache
      return caches.match(request).then((cached) => {
        if (cached) {return cached;}
        // Fallback al admin principal
        return caches.match(ADMIN_OFFLINE_URL);
      });
    })
  );
});

// Push notifications
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
  event.waitUntil(globalThis.registration.showNotification(title, options));
});

globalThis.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/admin';
  event.waitUntil(globalThis.clients.openWindow(url));
});
