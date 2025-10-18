/**
 * Email Unsubscribe Preferences Model
 * Workplan Line 368: Unsubscribe link (except URGENT)
 */

const mongoose = require('mongoose');

const UnsubscribeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    preferences: {
      // User can opt out of specific notification types
      recruitment_open: { type: Boolean, default: true },
      recruitment_closing: { type: Boolean, default: true },
      application_status: { type: Boolean, default: true },
      event_reminder: { type: Boolean, default: true },
      approval_required: { type: Boolean, default: true }, // Cannot unsubscribe
      role_assigned: { type: Boolean, default: true },
      system_maintenance: { type: Boolean, default: true } // Cannot unsubscribe for URGENT
    },
    unsubscribedAll: {
      type: Boolean,
      default: false
    },
    unsubscribedAt: Date
  },
  { timestamps: true }
);

// Generate unsubscribe token
UnsubscribeSchema.statics.generateToken = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Get or create preferences for a user
UnsubscribeSchema.statics.getOrCreatePreferences = async function(userId, email) {
  let prefs = await this.findOne({ user: userId });
  
  if (!prefs) {
    prefs = await this.create({
      user: userId,
      email,
      unsubscribeToken: this.generateToken()
    });
  }
  
  return prefs;
};

// Check if user has unsubscribed from a specific notification type
UnsubscribeSchema.methods.hasUnsubscribed = function(notificationType) {
  if (this.unsubscribedAll) return true;
  return this.preferences[notificationType] === false;
};

module.exports.Unsubscribe = mongoose.model('Unsubscribe', UnsubscribeSchema);
