// sw.js — Push notification service worker.
// Must be served from the site root (or the path passed as `scope` in
// navigator.serviceWorker.register) so its scope covers the whole app.

const DEFAULT_TITLE = 'New notification';

self.addEventListener('install', (event) => {
  // Activate this SW as soon as it's finished installing.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of any open clients immediately.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    // Payload wasn't JSON — fall back to plain text.
    payload = { title: DEFAULT_TITLE, body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || DEFAULT_TITLE;
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || undefined,
    data: payload.data || {},
    timestamp: payload.timestamp || Date.now()
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // If the app is already open, focus it instead of opening a new tab.
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && client.url !== targetUrl) {
            client.navigate(targetUrl).catch(() => {});
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
