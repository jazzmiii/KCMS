// src/modules/auth/session.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SessionSchema = new Schema({
  user:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sha256Hash: { type: String, required: true, index: true },
  bcryptHash: { type: String, required: true },
  ip:         String,
  userAgent:  String,
  expiresAt:  { type: Date, required: true },
  revokedAt:  Date
}, { timestamps: true });

module.exports.Session = mongoose.model('Session', SessionSchema);