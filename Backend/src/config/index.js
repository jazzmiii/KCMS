require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

// Base configuration that applies to all environments
const base = {
  // Application
  NODE_ENV: env,
  PORT: parseInt(process.env.PORT) || 8000,
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI,
  
  // Redis
  REDIS_URL: process.env.REDIS_URL,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
  JWT_ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
  JWT_PRIVATE_KEY_PATH: process.env.JWT_PRIVATE_KEY_PATH,
  JWT_PUBLIC_KEY_PATH: process.env.JWT_PUBLIC_KEY_PATH,
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  
  // SMTP Configuration
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
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
  NOTIFICATION_BATCH_EVERY_MS: parseInt(process.env.NOTIFICATION_BATCH_EVERY_MS) || 300000,
  NOTIFICATION_WORKER_CONCURRENCY: parseInt(process.env.NOTIFICATION_WORKER_CONCURRENCY) || 10,
  AUDIT_WORKER_CONCURRENCY: parseInt(process.env.AUDIT_WORKER_CONCURRENCY) || 20,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // File Upload Limits
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10mb',
  MAX_FILES_PER_UPLOAD: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10,
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  SESSION_SECRET: process.env.SESSION_SECRET,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || (env === 'production' ? 'combined' : 'dev'),
  
  // Performance
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 3600,
  SEARCH_RESULTS_LIMIT: parseInt(process.env.SEARCH_RESULTS_LIMIT) || 50,
  
  // Monitoring
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  METRICS_PORT: parseInt(process.env.METRICS_PORT) || 9090,
  
  // Development/Testing flags
  DEBUG: process.env.DEBUG === 'true',
  VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true'
};

// Environment-specific overrides
const envConfig = require(`../../config/${env}.js`);
const config = { ...base, ...envConfig };

// Validation for required production variables
if (env === 'production') {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'FRONTEND_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];
  
  const missing = required.filter(key => !config[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables for production:`);
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
  
  // Security warnings for production
  if (config.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET in production!');
  }
  
  if (config.CORS_ORIGINS === '*' || !config.CORS_ORIGINS) {
    console.warn('⚠️  WARNING: CORS_ORIGINS not set or too permissive for production!');
  }
  
  console.log('✅ Production configuration validated successfully');
}

module.exports = config;
