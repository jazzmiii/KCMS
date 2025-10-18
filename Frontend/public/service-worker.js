/**
 * Service Worker for Push Notifications
 * Handles push notification events when app is closed
 */

/* eslint-disable no-restricted-globals */

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received:', event);

  // Default notification data
  let notificationData = {
    title: 'KMIT Clubs Hub',
    body: 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'default',
    requireInteraction: false,
    data: {
      url: '/'
    }
  };

  // Try to parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || notificationData.requireInteraction,
        data: {
          url: data.url || data.link || '/',
          ...data.data
        }
      };
    } catch (error) {
      console.error('[Service Worker] Failed to parse push data:', error);
    }
  }

  // Show notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Open'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  // Handle different actions
  if (event.action === 'close') {
    return;
  }

  // Get URL from notification data
  const urlToOpen = event.notification.data?.url || '/';

  // Open the URL
  const promiseChain = clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
  
  // Optional: Track notification close analytics
  const notificationTag = event.notification.tag;
  const dismissalEvent = {
    action: 'dismissed',
    tag: notificationTag,
    timestamp: new Date().toISOString()
  };

  console.log('[Service Worker] Notification dismissed:', dismissalEvent);
});

// Sync event (for background sync if needed)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === 'notification-sync') {
    // Handle background sync for notifications
    event.waitUntil(
      // Add your sync logic here
      Promise.resolve()
    );
  }
});

// Message event (for communication with main thread)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Send response back to main thread
  if (event.ports[0]) {
    event.ports[0].postMessage({ received: true });
  }
});

// Fetch event (optional - for offline support)
self.addEventListener('fetch', (event) => {
  // Add caching strategy here if needed
  // For now, just pass through all requests
  event.respondWith(fetch(event.request));
});

console.log('[Service Worker] Service worker script loaded');
