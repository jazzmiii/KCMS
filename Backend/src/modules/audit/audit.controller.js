const svc = require('./audit.service');
const { successResponse } = require('../../utils/response');

/**
 * List audit logs with filtering
 */
exports.list = async (req, res, next) => {
  try {
    const data = await svc.list(req.query);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

/**
 * Get audit statistics
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const stats = await svc.getStatistics(req.query);
    successResponse(res, { statistics: stats });
  } catch (err) {
    next(err);
  }
};

/**
 * Get recent critical/high severity logs
 */
exports.getRecentCritical = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const logs = await svc.getRecentCritical(limit);
    successResponse(res, { logs });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user activity logs
 */
exports.getUserActivity = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = await svc.getUserActivity(userId, req.query);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

/**
 * Export audit logs to CSV
 */
exports.exportCSV = async (req, res, next) => {
  try {
    const csv = await svc.exportToCSV(req.query);
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};