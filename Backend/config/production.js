module.exports = {
  // Database
  MONGODB_URI: process.env.MONGODB_URI,
  
  // Redis
  REDIS_URL: process.env.REDIS_URL,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  
  // SMTP Configuration
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'KMIT Clubs Hub',
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL,
  
  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  
  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // Worker Configuration
  START_SCHEDULERS: process.env.START_SCHEDULERS !== 'false',
  START_NOTIFICATION_BATCH: process.env.START_NOTIFICATION_BATCH !== 'false',
  NOTIFICATION_BATCH_EVERY_MS: process.env.NOTIFICATION_BATCH_EVERY_MS || 300000, // 5 minutes
  NOTIFICATION_WORKER_CONCURRENCY: process.env.NOTIFICATION_WORKER_CONCURRENCY || 10,
  AUDIT_WORKER_CONCURRENCY: process.env.AUDIT_WORKER_CONCURRENCY || 20,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  
  // File Upload Limits
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10mb',
  MAX_FILES_PER_UPLOAD: process.env.MAX_FILES_PER_UPLOAD || 10,
  
  // Security
  BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || 12,
  SESSION_SECRET: process.env.SESSION_SECRET,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
  
  // Performance
  CACHE_TTL: process.env.CACHE_TTL || 3600, // 1 hour
  SEARCH_RESULTS_LIMIT: process.env.SEARCH_RESULTS_LIMIT || 50,
  
  // Monitoring
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  METRICS_PORT: process.env.METRICS_PORT || 9090,
  
  // Development/Testing flags (disabled in production)
  NODE_ENV: 'production',
  DEBUG: false,
  VERBOSE_LOGGING: false
};
