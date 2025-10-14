// src/modules/audit/auditLog.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    user:       { type: Schema.Types.ObjectId, ref: 'User' },
    action:     { type: String, required: true, index: true },  // e.g. "USER_LOGIN"
    target:     { type: String, index: true },                  // e.g. "User:1234"
    oldValue:   Schema.Types.Mixed,
    newValue:   Schema.Types.Mixed,
    ip:         String,
    userAgent:  String,
    severity:   { 
      type: String, 
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    status:     { 
      type: String, 
      enum: ['success', 'failure'], 
      default: 'success' 
    },
    errorMessage: String,
    metadata:   Schema.Types.Mixed  // Additional context-specific data
  },
  { timestamps: true }
);

// Indexes for common queries
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });

module.exports.AuditLog = mongoose.model('AuditLog', AuditLogSchema);