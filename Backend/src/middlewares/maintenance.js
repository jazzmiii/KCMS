// src/middlewares/maintenance.js
const config = require('../config');
const redis = require('../config/redis');

/**
 * Maintenance Mode Middleware
 * Checks if system is in maintenance mode and blocks requests
 */
const MAINTENANCE_KEY = 'system:maintenance';

async function maintenanceMode(req, res, next) {
  try {
    // Skip maintenance check for health endpoint
    if (req.path === '/api/health' || req.path.startsWith('/api/health/')) {
      return next();
    }

    // Check if maintenance mode is enabled
    const isMaintenanceMode = await redis.get(MAINTENANCE_KEY);
    
    if (isMaintenanceMode === 'true') {
      const maintenanceInfo = await redis.get(`${MAINTENANCE_KEY}:info`);
      const info = maintenanceInfo ? JSON.parse(maintenanceInfo) : {};
      
      return res.status(503).json({
        status: 'error',
        message: 'System is currently under maintenance. Please try again later.',
        maintenance: {
          enabled: true,
          reason: info.reason || 'Scheduled maintenance',
          estimatedEnd: info.estimatedEnd || null,
          startedAt: info.startedAt || null,
          message: info.message || 'We are performing system upgrades.'
        }
      });
    }

    return next();
  } catch (error) {
    console.error('Maintenance mode check failed:', error);
    // Fail open - allow request if Redis is down
    return next();
  }
}

/**
 * Enable maintenance mode
 * @param {Object} options - Maintenance mode options
 * @param {string} options.reason - Reason for maintenance
 * @param {string} options.estimatedEnd - Estimated end time (ISO string)
 * @param {string} options.message - Custom message to users
 */
async function enableMaintenanceMode(options = {}) {
  await redis.set(MAINTENANCE_KEY, 'true');
  await redis.set(`${MAINTENANCE_KEY}:info`, JSON.stringify({
    reason: options.reason || 'Scheduled maintenance',
    estimatedEnd: options.estimatedEnd || null,
    startedAt: new Date().toISOString(),
    message: options.message || 'We are performing system upgrades.',
    enabledBy: options.enabledBy || 'system'
  }));
  console.log('✅ Maintenance mode enabled');
}

/**
 * Disable maintenance mode
 */
async function disableMaintenanceMode() {
  await redis.del(MAINTENANCE_KEY);
  await redis.del(`${MAINTENANCE_KEY}:info`);
  console.log('✅ Maintenance mode disabled');
}

/**
 * Check if maintenance mode is enabled
 */
async function isMaintenanceModeEnabled() {
  const enabled = await redis.get(MAINTENANCE_KEY);
  return enabled === 'true';
}

/**
 * Get maintenance mode info
 */
async function getMaintenanceInfo() {
  const enabled = await isMaintenanceModeEnabled();
  if (!enabled) return null;
  
  const infoStr = await redis.get(`${MAINTENANCE_KEY}:info`);
  return infoStr ? JSON.parse(infoStr) : null;
}

module.exports = {
  maintenanceMode,
  enableMaintenanceMode,
  disableMaintenanceMode,
  isMaintenanceModeEnabled,
  getMaintenanceInfo
};
