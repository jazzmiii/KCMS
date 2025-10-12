// Staging environment configuration overrides
module.exports = {
  // Staging-specific settings (similar to production but with more logging)
  LOG_LEVEL: 'info',
  LOG_FORMAT: 'combined',
  
  // Staging debugging
  VERBOSE_LOGGING: true,
  DEBUG: false,
  
  // Moderate cache TTLs
  CACHE_TTL: 300, // 5 minutes
  
  // Production-like rate limiting but slightly relaxed
  RATE_LIMIT_WINDOW_MS: 900000, // 15 min
  RATE_LIMIT_MAX_REQUESTS: 200, // Slightly higher than production
  
  // Standard worker intervals
  NOTIFICATION_BATCH_EVERY_MS: 300000, // 5 minutes
  
  // Enable all features for testing
  START_SCHEDULERS: true,
  START_NOTIFICATION_BATCH: true,
  
  // Audit retention (shorter for staging)
  AUDIT_LOG_RETENTION_DAYS: 90 // 3 months instead of 2 years
};
