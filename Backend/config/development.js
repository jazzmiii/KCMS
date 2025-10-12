// Development environment configuration overrides
module.exports = {
  // Development-specific settings
  LOG_LEVEL: 'debug',
  LOG_FORMAT: 'dev',
  
  // Disable some security for easier debugging
  VERBOSE_LOGGING: true,
  DEBUG: true,
  
  // Lower cache TTLs for development
  CACHE_TTL: 60, // 1 minute
  
  // Relaxed rate limiting for dev
  RATE_LIMIT_WINDOW_MS: 900000, // 15 min
  RATE_LIMIT_MAX_REQUESTS: 1000, // Higher limit
  
  // Faster worker intervals for testing
  NOTIFICATION_BATCH_EVERY_MS: 60000, // 1 minute instead of 5
  
  // Development defaults
  START_SCHEDULERS: true,
  START_NOTIFICATION_BATCH: true
};
