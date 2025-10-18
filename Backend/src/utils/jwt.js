/**
 * JWT Utility with RS256 Support
 * Handles JWT signing and verification with asymmetric encryption
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Load RSA keys
let privateKey;
let publicKey;

try {
  // Determine key loading method based on configuration
  if (config.JWT_PRIVATE_KEY_PATH && config.JWT_PUBLIC_KEY_PATH) {
    // Load from files (development/staging)
    const privateKeyPath = path.resolve(process.cwd(), config.JWT_PRIVATE_KEY_PATH);
    const publicKeyPath = path.resolve(process.cwd(), config.JWT_PUBLIC_KEY_PATH);
    
    privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    
    console.log('✅ JWT RSA keys loaded from files');
  } else if (config.JWT_PRIVATE_KEY && config.JWT_PUBLIC_KEY) {
    // Load from environment variables (production)
    // Keys should be base64 encoded in env vars
    privateKey = Buffer.from(config.JWT_PRIVATE_KEY, 'base64').toString('utf8');
    publicKey = Buffer.from(config.JWT_PUBLIC_KEY, 'base64').toString('utf8');
    
    console.log('✅ JWT RSA keys loaded from environment variables');
  } else {
    // Fallback to symmetric key (for backward compatibility)
    console.warn('⚠️  WARNING: Using symmetric JWT_SECRET (HS256). For production, use RS256 with RSA keys.');
    privateKey = config.JWT_SECRET;
    publicKey = config.JWT_SECRET;
  }
} catch (error) {
  console.error('❌ Failed to load JWT keys:', error.message);
  console.warn('⚠️  Falling back to JWT_SECRET for symmetric signing');
  privateKey = config.JWT_SECRET;
  publicKey = config.JWT_SECRET;
}

// Determine algorithm
const algorithm = config.JWT_ALGORITHM || (privateKey === config.JWT_SECRET ? 'HS256' : 'RS256');

/**
 * Sign a JWT token
 * @param {Object} payload - Token payload
 * @param {Object} options - JWT sign options
 * @returns {string} Signed JWT token
 */
function sign(payload, options = {}) {
  const defaultOptions = {
    algorithm,
    expiresIn: config.JWT_EXPIRY || '15m',
    issuer: 'kmit-clubs-hub',
    audience: 'kmit-students'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    return jwt.sign(payload, privateKey, mergedOptions);
  } catch (error) {
    console.error('JWT signing error:', error);
    throw new Error('Failed to sign JWT token');
  }
}

/**
 * Verify a JWT token with migration support
 * Workplan Line 622: JWT signing (RS256)
 * Supports both HS256 and RS256 during migration period
 * 
 * @param {string} token - JWT token to verify
 * @param {Object} options - JWT verify options
 * @returns {Object} Decoded token payload
 */
function verify(token, options = {}) {
  const defaultOptions = {
    algorithms: [algorithm],
    issuer: 'kmit-clubs-hub',
    audience: 'kmit-students'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    // Try verifying with current algorithm/key
    return jwt.verify(token, publicKey, mergedOptions);
  } catch (primaryError) {
    // During migration: if current is RS256 and verification fails,
    // try fallback to HS256 for backward compatibility
    if (config.JWT_MIGRATION_MODE === 'true' && algorithm === 'RS256' && config.JWT_SECRET) {
      try {
        console.log('🔄 Migration mode: Attempting HS256 verification for legacy token');
        const fallbackOptions = {
          ...mergedOptions,
          algorithms: ['HS256']
        };
        return jwt.verify(token, config.JWT_SECRET, fallbackOptions);
      } catch (fallbackError) {
        // If both fail, throw the original error
        console.warn('⚠️  Token verification failed with both RS256 and HS256');
      }
    }
    
    // Handle specific error types
    if (primaryError.name === 'TokenExpiredError') {
      const err = new Error('Token expired');
      err.name = 'TokenExpiredError';
      err.expiredAt = primaryError.expiredAt;
      throw err;
    }
    
    if (primaryError.name === 'JsonWebTokenError') {
      const err = new Error('Invalid token');
      err.name = 'JsonWebTokenError';
      throw err;
    }
    
    throw primaryError;
  }
}

/**
 * Decode a JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token
 */
function decode(token) {
  return jwt.decode(token, { complete: true });
}

/**
 * Get token info
 * @returns {Object} Information about current JWT configuration
 */
function getInfo() {
  return {
    algorithm,
    issuer: 'kmit-clubs-hub',
    audience: 'kmit-students',
    accessTokenExpiry: config.JWT_EXPIRY,
    refreshTokenExpiry: config.REFRESH_TOKEN_EXPIRY,
    isAsymmetric: algorithm.startsWith('RS') || algorithm.startsWith('ES'),
    migrationMode: config.JWT_MIGRATION_MODE === 'true',
    supportsHS256Fallback: config.JWT_MIGRATION_MODE === 'true' && !!config.JWT_SECRET,
    keySource: (config.JWT_PRIVATE_KEY_PATH && config.JWT_PUBLIC_KEY_PATH) 
      ? 'files' 
      : (config.JWT_PRIVATE_KEY && config.JWT_PUBLIC_KEY) 
        ? 'environment' 
        : 'symmetric'
  };
}

module.exports = {
  sign,
  verify,
  decode,
  getInfo,
  algorithm
};
