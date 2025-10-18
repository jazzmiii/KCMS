// src/modules/auth/session.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SessionSchema = new Schema({
  user:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sha256Hash: { type: String, required: true, index: true },
  bcryptHash: { type: String, required: true },
  ip:         String,
  userAgent:  String,
  // Device fingerprinting for security (Workplan: device fingerprinting)
  deviceFingerprint: { type: String, index: true }, // Hash of device characteristics
  deviceInfo: {
    browser: String,      // Chrome, Firefox, Safari, etc.
    browserVersion: String,
    os: String,          // Windows, macOS, Linux, Android, iOS
    osVersion: String,
    deviceType: String,  // desktop, mobile, tablet
    deviceName: String   // User-friendly device identifier
  },
  isNewDevice: { type: Boolean, default: false }, // Track if this was a new device login
  rememberDevice: { type: Boolean, default: false }, // 30-day remember device flag
  rememberDeviceExpiresAt: Date, // Expiry for remember device feature
  expiresAt:  { type: Date, required: true },
  revokedAt:  Date
}, { timestamps: true });

module.exports.Session = mongoose.model('Session', SessionSchema);