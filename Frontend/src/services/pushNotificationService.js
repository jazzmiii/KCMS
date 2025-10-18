import api from './api';

/**
 * Push Notification Service
 * Backend Gap Implementation - Browser push notifications
 */
const pushNotificationService = {
  /**
   * Get VAPID public key for subscription
   */
  getVapidKey: async () => {
    const response = await api.get('/notifications/push/vapid-key');
    return response.data;
  },

  /**
   * Subscribe to push notifications
   */
  subscribe: async (subscription) => {
    const response = await api.post('/notifications/push/subscribe', subscription);
    return response.data;
  },

  /**
   * Unsubscribe from push notifications
   */
  unsubscribe: async (endpoint) => {
    const response = await api.post('/notifications/push/unsubscribe', { endpoint });
    return response.data;
  },

  /**
   * List user's push subscriptions
   */
  listSubscriptions: async () => {
    const response = await api.get('/notifications/push/subscriptions');
    return response.data;
  },

  /**
   * Test push notification (development only)
   */
  testPush: async () => {
    const response = await api.post('/notifications/push/test');
    return response.data;
  },

  /**
   * Check if push notifications are supported
   */
  isSupported: () => {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /**
   * Request notification permission from browser
   */
  requestPermission: async () => {
    if (!pushNotificationService.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  /**
   * Get current notification permission status
   */
  getPermissionStatus: () => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission; // 'granted', 'denied', or 'default'
  },

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  urlBase64ToUint8Array: (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  /**
   * Subscribe to push notifications (complete flow)
   */
  subscribeToPush: async () => {
    try {
      // Check support
      if (!pushNotificationService.isSupported()) {
        throw new Error('Push notifications are not supported');
      }

      // Request permission
      const permissionGranted = await pushNotificationService.requestPermission();
      if (!permissionGranted) {
        throw new Error('Notification permission denied');
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from backend
      const vapidResponse = await pushNotificationService.getVapidKey();
      const vapidPublicKey = vapidResponse.data.publicKey;

      // Convert VAPID key to Uint8Array
      const applicationServerKey = pushNotificationService.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      // Send subscription to backend
      await pushNotificationService.subscribe(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  },

  /**
   * Unsubscribe from push notifications (complete flow)
   */
  unsubscribeFromPush: async () => {
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get current subscription
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        return { success: true, message: 'No active subscription' };
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Notify backend
      await pushNotificationService.unsubscribe(subscription.endpoint);

      return { success: true, message: 'Successfully unsubscribed' };
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  },

  /**
   * Check if user is currently subscribed
   */
  checkSubscription: async () => {
    try {
      if (!pushNotificationService.isSupported()) {
        return { subscribed: false, reason: 'unsupported' };
      }

      if (Notification.permission !== 'granted') {
        return { subscribed: false, reason: 'permission_denied' };
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      return {
        subscribed: !!subscription,
        subscription: subscription
      };
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return { subscribed: false, reason: 'error' };
    }
  },

  /**
   * Show a test notification (doesn't require backend)
   */
  showTestNotification: () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('KMIT Clubs Hub', {
        body: 'Push notifications are working! 🎉',
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'test-notification',
        requireInteraction: false
      });
    }
  }
};

export default pushNotificationService;
