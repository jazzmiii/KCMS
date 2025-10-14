const svc = require('./settings.service');
const { successResponse } = require('../../utils/response');

/**
 * Get all system settings
 */
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await svc.getSettings();
    successResponse(res, { settings });
  } catch (err) {
    next(err);
  }
};

/**
 * Get specific settings section
 */
exports.getSection = async (req, res, next) => {
  try {
    const section = await svc.getSection(req.params.section);
    successResponse(res, { section: req.params.section, settings: section });
  } catch (err) {
    next(err);
  }
};

/**
 * Update system settings
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await svc.updateSettings(
      req.body,
      {
        id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    );
    successResponse(res, { settings }, 'Settings updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Update specific settings section
 */
exports.updateSection = async (req, res, next) => {
  try {
    const result = await svc.updateSection(
      req.params.section,
      req.body,
      {
        id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    );
    successResponse(res, result, `${req.params.section} settings updated`);
  } catch (err) {
    next(err);
  }
};

/**
 * Reset settings to defaults
 */
exports.resetToDefaults = async (req, res, next) => {
  try {
    const settings = await svc.resetToDefaults({
      id: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    successResponse(res, { settings }, 'Settings reset to defaults');
  } catch (err) {
    next(err);
  }
};

/**
 * Check if feature is enabled
 */
exports.checkFeature = async (req, res, next) => {
  try {
    const enabled = await svc.isFeatureEnabled(req.params.feature);
    successResponse(res, { feature: req.params.feature, enabled });
  } catch (err) {
    next(err);
  }
};

/**
 * Get budget limit for category
 */
exports.getBudgetLimit = async (req, res, next) => {
  try {
    const limit = await svc.getBudgetLimit(req.params.category);
    successResponse(res, { category: req.params.category, limit });
  } catch (err) {
    next(err);
  }
};
