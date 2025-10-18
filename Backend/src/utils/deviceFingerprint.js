// src/utils/deviceFingerprint.js
const crypto = require('crypto');

/**
 * Parse user agent to extract device information
 * @param {string} userAgent - User agent string
 * @returns {Object} Device information
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      osVersion: '',
      deviceType: 'unknown',
      deviceName: 'Unknown Device'
    };
  }

  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (ua.includes('chrome') && !ua.includes('edge') && !ua.includes('edg/')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('edge') || ua.includes('edg/')) {
    browser = 'Edge';
    const match = ua.match(/edg?\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('opera') || ua.includes('opr/')) {
    browser = 'Opera';
    const match = ua.match(/(?:opera|opr)\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  }

  // Detect OS
  let os = 'Unknown';
  let osVersion = '';
  
  if (ua.includes('windows')) {
    os = 'Windows';
    if (ua.includes('windows nt 10.0')) osVersion = '10/11';
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
    else if (ua.includes('windows nt 6.2')) osVersion = '8';
    else if (ua.includes('windows nt 6.1')) osVersion = '7';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    const match = ua.match(/mac os x ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : '';
  } else if (ua.includes('linux')) {
    os = 'Linux';
    if (ua.includes('ubuntu')) osVersion = 'Ubuntu';
    else if (ua.includes('fedora')) osVersion = 'Fedora';
  } else if (ua.includes('android')) {
    os = 'Android';
    const match = ua.match(/android ([\d.]+)/);
    osVersion = match ? match[1] : '';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = ua.includes('ipad') ? 'iPadOS' : 'iOS';
    const match = ua.match(/os ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : '';
  }

  // Detect device type
  let deviceType = 'desktop';
  if (ua.includes('mobile') || ua.includes('android')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }

  // Create device name
  const deviceName = `${browser} on ${os}`;

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    deviceName
  };
}

/**
 * Generate device fingerprint hash from device characteristics
 * @param {string} userAgent - User agent string
 * @param {string} ip - IP address
 * @returns {string} Device fingerprint hash
 */
function generateDeviceFingerprint(userAgent, ip) {
  const deviceInfo = parseUserAgent(userAgent);
  
  // Create fingerprint from stable device characteristics
  // Note: IP is excluded from fingerprint as it may change (VPN, mobile networks)
  const fingerprintData = [
    deviceInfo.browser,
    deviceInfo.os,
    deviceInfo.deviceType,
    userAgent || ''
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(fingerprintData)
    .digest('hex')
    .substring(0, 32); // Use first 32 chars for storage efficiency
}

/**
 * Check if device is recognized (exists in user's sessions)
 * @param {string} userId - User ID
 * @param {string} deviceFingerprint - Device fingerprint hash
 * @returns {Promise<boolean>} True if device is recognized
 */
async function isDeviceRecognized(userId, deviceFingerprint) {
  const { Session } = require('../modules/auth/session.model');
  
  const existingSession = await Session.findOne({
    user: userId,
    deviceFingerprint,
    revokedAt: null
  });

  return !!existingSession;
}

/**
 * Check if device is remembered (30-day remember feature)
 * @param {string} userId - User ID
 * @param {string} deviceFingerprint - Device fingerprint hash
 * @returns {Promise<boolean>} True if device is remembered and not expired
 */
async function isDeviceRemembered(userId, deviceFingerprint) {
  const { Session } = require('../modules/auth/session.model');
  
  const rememberedSession = await Session.findOne({
    user: userId,
    deviceFingerprint,
    rememberDevice: true,
    rememberDeviceExpiresAt: { $gt: new Date() },
    revokedAt: null
  });

  return !!rememberedSession;
}

module.exports = {
  parseUserAgent,
  generateDeviceFingerprint,
  isDeviceRecognized,
  isDeviceRemembered
};
