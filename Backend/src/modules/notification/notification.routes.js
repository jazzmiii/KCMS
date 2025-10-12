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

module.exports = router;