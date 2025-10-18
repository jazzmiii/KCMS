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

// Workplan Line 495-498: 2-year retention policy
// TTL index - automatically delete logs older than 2 years (730 days)
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years in seconds

// Prevent modifications to audit logs (immutable after creation)
AuditLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable and cannot be modified'));
  }
  next();
});

// Prevent updates
AuditLogSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('Audit logs are immutable and cannot be updated'));
});

AuditLogSchema.pre('updateOne', function(next) {
  next(new Error('Audit logs are immutable and cannot be updated'));
});

AuditLogSchema.pre('updateMany', function(next) {
  next(new Error('Audit logs are immutable and cannot be updated'));
});

// Prevent deletions (except through TTL)
AuditLogSchema.pre('deleteOne', function(next) {
  next(new Error('Audit logs cannot be manually deleted. They will auto-expire after 2 years.'));
});

AuditLogSchema.pre('deleteMany', function(next) {
  next(new Error('Audit logs cannot be manually deleted. They will auto-expire after 2 years.'));
});

module.exports.AuditLog = mongoose.model('AuditLog', AuditLogSchema);