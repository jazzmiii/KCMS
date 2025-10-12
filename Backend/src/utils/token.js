const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function signAccessToken(sub, extra = {}) {
  const config = require('../config');
  return jwt.sign({ sub, ...extra }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
}

function generateRefreshToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

function hashRefreshToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
};
