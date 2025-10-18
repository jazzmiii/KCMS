const router       = require('express').Router();
const authenticate = require('../../middlewares/auth');
const {permit}       = require('../../middlewares/permission');
const validate     = require('../../middlewares/validate');
const v            = require('./notification.validators');
const ctrl         = require('./notification.controller');

// Admin-only create
router.post(
  '/',
  authenticate,
  permit({ global: ['admin'] }),
  validate(v.createNotification),
  ctrl.create
);

// List for current user
router.get(
  '/',
  authenticate,
  validate(v.listNotifications, 'query'),
  ctrl.list
);

// Mark single read/unread
router.patch(
  '/:id/read',
  authenticate,
  validate(v.notifId, 'params'),
  validate(v.markRead),
  ctrl.markRead
);

// Mark all read
router.post(
  '/read-all',
  authenticate,
  ctrl.markAllRead
);

// Unread count
router.get(
  '/count-unread',
  authenticate,
  ctrl.countUnread
);

// Push Notification Subscription Routes (Workplan: Future feature - browser notifications)

// Get VAPID public key for client subscription
router.get(
  '/push/vapid-key',
  ctrl.getVapidKey
);

// Subscribe to push notifications
router.post(
  '/push/subscribe',
  authenticate,
  validate(v.pushSubscribe),
  ctrl.subscribePush
);

// Unsubscribe from push notifications
router.post(
  '/push/unsubscribe',
  authenticate,
  validate(v.pushUnsubscribe),
  ctrl.unsubscribePush
);

// Get user's push subscriptions
router.get(
  '/push/subscriptions',
  authenticate,
  ctrl.listPushSubscriptions
);

// Test push notification (development only)
router.post(
  '/push/test',
  authenticate,
  ctrl.testPush
);

// Email Unsubscribe Routes (Workplan Line 368: Unsubscribe link except URGENT)
const unsubscribeCtrl = require('./unsubscribe.controller');

// Get unsubscribe preferences (no auth - uses token)
router.get(
  '/unsubscribe/:token',
  unsubscribeCtrl.getPreferences
);

// Unsubscribe from specific notification type
router.post(
  '/unsubscribe/:token/type',
  unsubscribeCtrl.unsubscribeFromType
);

// Unsubscribe from all non-urgent notifications
router.post(
  '/unsubscribe/:token/all',
  unsubscribeCtrl.unsubscribeAll
);

// Resubscribe to a notification type
router.post(
  '/unsubscribe/:token/resubscribe',
  unsubscribeCtrl.resubscribeToType
);

// Update notification preferences
router.put(
  '/unsubscribe/:token/preferences',
  unsubscribeCtrl.updatePreferences
);

module.exports = router;