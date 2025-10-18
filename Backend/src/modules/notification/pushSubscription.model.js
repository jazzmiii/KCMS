// src/modules/notification/pushSubscription.model.js
const mongoose = require('mongoose');

/**
 * Push Subscription Model
 * Stores web push subscription details for browser push notifications
 */
const PushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subscription: {
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
      }
    },
    deviceInfo: {
      browser: String,
      os: String,
      deviceType: String,
      userAgent: String
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    lastUsed: Date,
    expiresAt: Date
  },
  { timestamps: true }
);

// Compound index for finding active subscriptions
PushSubscriptionSchema.index({ user: 1, active: 1 });

// Unique index to prevent duplicate subscriptions
PushSubscriptionSchema.index({ 'subscription.endpoint': 1 }, { unique: true });

module.exports.PushSubscription = mongoose.model('PushSubscription', PushSubscriptionSchema);
