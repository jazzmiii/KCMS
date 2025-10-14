const router = require('express').Router();
const authenticate = require('../../middlewares/auth');
const permit       = require('../../middlewares/permission');
const validate     = require('../../middlewares/validate');
const v            = require('./audit.validators');
const ctrl         = require('./audit.controller');

/**
 * List audit logs (admin only)
 * GET /api/audit
 */
router.get(
  '/',
  authenticate,
  permit({ global: ['admin'] }),
  validate(v.listSchema, 'query'),
  ctrl.list
);

/**
 * Get audit statistics (admin only)
 * GET /api/audit/statistics
 */
router.get(
  '/statistics',
  authenticate,
  permit({ global: ['admin'] }),
  ctrl.getStatistics
);

/**
 * Get recent critical/high severity logs (admin only)
 * GET /api/audit/critical
 */
router.get(
  '/critical',
  authenticate,
  permit({ global: ['admin'] }),
  ctrl.getRecentCritical
);

/**
 * Export audit logs to CSV (admin only)
 * GET /api/audit/export
 */
router.get(
  '/export',
  authenticate,
  permit({ global: ['admin'] }),
  ctrl.exportCSV
);

/**
 * Get user activity logs (admin only)
 * GET /api/audit/user/:userId
 */
router.get(
  '/user/:userId',
  authenticate,
  permit({ global: ['admin'] }),
  ctrl.getUserActivity
);

module.exports = router;