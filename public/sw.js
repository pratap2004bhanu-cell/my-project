const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
const SHELL_CACHE = 'letsgo-shell-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL).catch(() => null)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const isBrowserExt = (url) =>
  url.hostname !== self.location.hostname ||
  url.pathname.startsWith('/api') ||
  url.pathname.startsWith('/auth') ||
  url.pathname.startsWith('/socket.io');

// Network-first: keeps things fresh in dev too, and falls back to cache when offline.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || isBrowserExt(url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const network = await fetch(event.request);
        if (network.ok) cache.put(event.request, network.clone());
        return network;
      } catch (err) {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const shell = await cache.match('/index.html');
          if (shell) return shell;
        }
        throw err;
      }
    })()
  );
});

// ---- Web push ----
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* ignore malformed payloads */
  }
  const title = data.title || "Let's Go";
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.path || '/';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('navigate' in client) {
          await client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })()
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const fresh = await self.registration.pushManager.getSubscription();
        await fetch('/api/users/me/push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fresh ? { endpoint: fresh.endpoint, keys: fresh.toJSON().keys } : {}),
        });
      } catch {
        /* best effort */
      }
    })()
  );
});