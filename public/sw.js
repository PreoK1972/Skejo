const CACHE_NAME = 'skejo-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network first for index.html/root
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Stale while revalidate for other static assets
    e.respondWith(
      caches.match(e.request).then(cached => {
        const networked = fetch(e.request)
          .then(res => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            return res;
          })
          .catch(() => cached);
        return cached || networked;
      })
    );
  }
});

self.addEventListener('push', e => {
  if (e.data) {
    try {
      const payload = e.data.json();
      const options = {
        body: payload.body,
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [200, 100, 200],
        data: payload.data || {},
        requireInteraction: true
      };
      e.waitUntil(
        self.registration.showNotification(payload.title, options)
      );
    } catch (err) {
      console.error('Error parsing push data:', err);
    }
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const taskId = e.notification.data.taskId;
  const type = e.notification.data.type;
  
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'ALARM_CLICKED',
            taskId: taskId,
            alarmType: type
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        const url = `./?alarmTask=${taskId}&alarmType=${type}`;
        return self.clients.openWindow(url);
      }
    })
  );
});


