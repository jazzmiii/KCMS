const router = require('express').Router();
const authenticate = require('../../middlewares/auth');
const { requireAdmin } = require('../../middlewares/permission');
const validate = require('../../middlewares/validate');
const v = require('./settings.validators');
const ctrl = require('./settings.controller');

/**
 * Get all system settings
 * GET /api/settings
 * Permission: Admin only
 */
router.get(
  '/',
  authenticate,
  requireAdmin(),
  ctrl.getSettings
);

/**
 * Get specific settings section
 * GET /api/settings/:section
 * Permission: Admin only
 */
router.get(
  '/:section',
  authenticate,
  requireAdmin(),
  validate(v.sectionParam, 'params'),
  ctrl.getSection
);

/**
 * Update all system settings
 * PUT /api/settings
 * Permission: Admin only
 */
router.put(
  '/',
  authenticate,
  requireAdmin(),
  validate(v.updateSettings),
  ctrl.updateSettings
);

/**
 * Update specific settings section
 * PUT /api/settings/:section
 * Permission: Admin only
 */
router.put(
  '/:section',
  authenticate,
  requireAdmin(),
  validate(v.sectionParam, 'params'),
  ctrl.updateSection
);

/**
 * Reset settings to defaults
 * POST /api/settings/reset
 * Permission: Admin only
 */
router.post(
  '/reset',
  authenticate,
  requireAdmin(),
  ctrl.resetToDefaults
);

/**
 * Check if feature is enabled
 * GET /api/settings/feature/:feature
 * Permission: Authenticated users
 */
router.get(
  '/feature/:feature',
  authenticate,
  validate(v.featureParam, 'params'),
  ctrl.checkFeature
);

/**
 * Get budget limit for category
 * GET /api/settings/budget-limit/:category
 * Permission: Authenticated users
 */
router.get(
  '/budget-limit/:category',
  authenticate,
  validate(v.categoryParam, 'params'),
  ctrl.getBudgetLimit
);

module.exports = router;
