const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
    type:     { type: String, enum: [
                  'recruitment_open','recruitment_closing','application_status',
                  'event_reminder','approval_required','role_assigned','system_maintenance'
                ], required: true },
    payload:  { type: mongoose.Schema.Types.Mixed, default: {} },
    priority: { type: String, enum: ['URGENT','HIGH','MEDIUM','LOW'], default: 'MEDIUM', index: true },
    isRead:   { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

module.exports.Notification = mongoose.model('Notification', NotificationSchema);