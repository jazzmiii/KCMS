// src/utils/cache.js
/**
 * Caching Utility with Resource-Specific TTLs
 * Workplan Lines 580-585: Explicit cache TTLs per resource type
 */

const config = require('../../config');

// Check if Redis client is available
let redis;
try {
  redis = require('../config/redis');
} catch (err) {
  console.warn('⚠️  Redis not configured. Caching disabled.');
}

/**
 * Resource-specific TTL configurations (in seconds)
 * Workplan Line 580-585: Different TTLs for different resource types
 */
const TTL_CONFIG = {
  // Club resources
  'club:list': 5 * 60,           // 5 minutes
  'club:detail': 5 * 60,         // 5 minutes
  'club:members': 5 * 60,        // 5 minutes
  
  // Event resources
  'event:calendar': 10 * 60,     // 10 minutes
  'event:list': 10 * 60,         // 10 minutes
  'event:detail': 10 * 60,       // 10 minutes
  
  // Dashboard & Stats
  'dashboard:stats': 1 * 60,     // 1 minute
  'admin:stats': 1 * 60,         // 1 minute
  
  // Search results
  'search:results': 30,          // 30 seconds
  'search:clubs': 30,            // 30 seconds
  'search:events': 30,           // 30 seconds
  
  // User data
  'user:profile': 15 * 60,       // 15 minutes
  'user:memberships': 5 * 60,    // 5 minutes
  
  // Recruitment
  'recruitment:list': 5 * 60,    // 5 minutes
  'recruitment:detail': 5 * 60,  // 5 minutes
  'recruitment:active': 5 * 60,  // 5 minutes
  
  // Notifications
  'notification:count': 2 * 60,  // 2 minutes
  'notification:recent': 5 * 60, // 5 minutes
  
  // Reports
  'report:data': 30 * 60,        // 30 minutes
  'report:analytics': 30 * 60,   // 30 minutes
  
  // System
  'system:settings': 60 * 60,    // 1 hour
  'system:config': 60 * 60,      // 1 hour
  
  // Default
  'default': config.CACHE_TTL || 3600  // 1 hour
};

/**
 * Get TTL for a cache key based on resource type
 * @param {string} key - Cache key
 * @returns {number} TTL in seconds
 */
function getTTL(key) {
  // Extract resource type from key (format: "resourceType:identifier")
  const parts = key.split(':');
  const resourceType = parts.length >= 2 ? `${parts[0]}:${parts[1]}` : parts[0];
  
  return TTL_CONFIG[resourceType] || TTL_CONFIG.default;
}

/**
 * Set a value in cache with resource-specific TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} [customTTL] - Optional custom TTL (overrides default)
 * @returns {Promise<boolean>} Success status
 */
async function set(key, value, customTTL = null) {
  if (!redis) return false;
  
  try {
    const ttl = customTTL || getTTL(key);
    const serialized = JSON.stringify(value);
    
    await redis.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached value or null
 */
async function get(key) {
  if (!redis) return null;
  
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Delete a value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
async function del(key) {
  if (!redis) return false;
  
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "club:*")
 * @returns {Promise<number>} Number of keys deleted
 */
async function delPattern(pattern) {
  if (!redis) return 0;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    
    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`Cache delete pattern error for ${pattern}:`, error);
    return 0;
  }
}

/**
 * Invalidate cache for a specific resource type
 * @param {string} resourceType - Resource type (e.g., "club", "event")
 * @returns {Promise<number>} Number of keys deleted
 */
async function invalidateResource(resourceType) {
  return delPattern(`${resourceType}:*`);
}

/**
 * Get or compute a cached value (cache-aside pattern)
 * @param {string} key - Cache key
 * @param {Function} computeFn - Function to compute value if not cached
 * @param {number} [customTTL] - Optional custom TTL
 * @returns {Promise<any>} Cached or computed value
 */
async function getOrCompute(key, computeFn, customTTL = null) {
  // Try to get from cache
  let value = await get(key);
  
  if (value !== null) {
    return value;
  }
  
  // Not in cache, compute the value
  value = await computeFn();
  
  // Store in cache for next time
  await set(key, value, customTTL);
  
  return value;
}

/**
 * Express middleware for automatic response caching
 * @param {string} keyPrefix - Prefix for cache key
 * @param {Function} [keyFn] - Function to generate cache key from request
 * @returns {Function} Express middleware
 */
function cacheMiddleware(keyPrefix, keyFn = null) {
  return async (req, res, next) => {
    if (!redis) return next();
    
    // Generate cache key
    const key = keyFn 
      ? `${keyPrefix}:${keyFn(req)}`
      : `${keyPrefix}:${req.originalUrl}`;
    
    // Try to get from cache
    const cached = await get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Store original res.json function
    const originalJson = res.json.bind(res);
    
    // Override res.json to cache the response
    res.json = function(data) {
      // Cache the response
      set(key, data).catch(err => 
        console.error('Cache middleware set error:', err)
      );
      
      // Send the response
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
async function getStats() {
  if (!redis) {
    return { available: false };
  }
  
  try {
    const info = await redis.info('stats');
    const dbsize = await redis.dbsize();
    
    return {
      available: true,
      keys: dbsize,
      info: info
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return { available: false, error: error.message };
  }
}

/**
 * Batch get multiple keys
 * @param {string[]} keys - Array of cache keys
 * @returns {Promise<Object>} Object with key-value pairs
 */
async function mget(keys) {
  if (!redis || keys.length === 0) return {};
  
  try {
    const values = await redis.mget(...keys);
    const result = {};
    
    keys.forEach((key, index) => {
      result[key] = values[index] ? JSON.parse(values[index]) : null;
    });
    
    return result;
  } catch (error) {
    console.error('Cache mget error:', error);
    return {};
  }
}

module.exports = {
  // Core operations
  set,
  get,
  del,
  delPattern,
  
  // Resource operations
  invalidateResource,
  getOrCompute,
  
  // Middleware
  cacheMiddleware,
  
  // Utilities
  getTTL,
  getStats,
  mget,
  
  // Config
  TTL_CONFIG
};
