// src/modules/audit/auditLog.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    user:       { type: Schema.Types.ObjectId, ref: 'User' },
    action:     { type: String, required: true },  // e.g. "USER_LOGIN"
    target:     { type: String },                  // e.g. "User:1234"
    oldValue:   Schema.Types.Mixed,
    newValue:   Schema.Types.Mixed,
    ip:         String,
    userAgent:  String
  },
  { timestamps: true }
);

module.exports.AuditLog = mongoose.model('AuditLog', AuditLogSchema);