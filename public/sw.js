
const CACHE_NAME = 'flixhub-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Listener para notificações push - melhorado
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'FlixHub',
    body: 'Você tem uma nova notificação!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'flixhub-notification',
    data: {
      url: '/'
    },
    requireInteraction: true,
    silent: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'FlixHub',
        body: data.message || data.body || 'Você tem uma nova notificação!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: data.tag || 'flixhub-notification',
        data: {
          url: data.url || '/',
          notificationId: data.id
        },
        requireInteraction: true,
        silent: false
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      actions: [
        {
          action: 'view',
          title: 'Ver'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ]
    }
  );

  event.waitUntil(promiseChain);
});

// Listener para cliques em notificações - melhorado
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(function(windowClients) {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url.includes(self.location.origin)) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus().then(function() {
        return matchingClient.navigate(urlToOpen);
      });
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

// Listener para fechar notificações
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});

// Melhorar o sistema de background sync para notificações offline
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // Aqui você pode implementar lógica para sincronizar notificações offline
    console.log('Sincronizando notificações em background');
  } catch (error) {
    console.error('Erro ao sincronizar notificações:', error);
  }
}
