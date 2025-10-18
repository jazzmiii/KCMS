// src/utils/pushNotification.js
/**
 * Push Notification Service
 * Workplan: Browser notifications and Mobile app notifications (Future feature)
 * 
 * NOTE: This implementation requires 'web-push' package
 * Install with: npm install web-push
 * 
 * Setup:
 * 1. Generate VAPID keys: npx web-push generate-vapid-keys
 * 2. Add keys to .env file
 * 3. Store user subscriptions in database
 */

const config = require('../../config');

// Check if web-push is available
let webpush;
try {
  webpush = require('web-push');
  
  // Configure web-push if VAPID keys are available
  if (config.VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      config.VAPID_SUBJECT || 'mailto:support@kmit.in',
      config.VAPID_PUBLIC_KEY,
      config.VAPID_PRIVATE_KEY
    );
  } else {
    console.warn('⚠️  VAPID keys not configured. Push notifications disabled.');
  }
} catch (err) {
  console.warn('⚠️  web-push not installed. Install with: npm install web-push');
}

/**
 * Send push notification to a subscription
 * @param {Object} subscription - Push subscription object
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Send result
 */
async function sendPushNotification(subscription, payload) {
  if (!webpush || !config.VAPID_PUBLIC_KEY) {
    return {
      success: false,
      error: 'Push notifications not configured'
    };
  }

  try {
    const notificationPayload = JSON.stringify({
      title: payload.title || 'KMIT Clubs Hub',
      body: payload.body || '',
      icon: payload.icon || '/icons/club-icon.png',
      badge: payload.badge || '/icons/badge.png',
      data: payload.data || {},
      actions: payload.actions || [],
      tag: payload.tag || 'default',
      requireInteraction: payload.requireInteraction || false,
      timestamp: Date.now()
    });

    const options = {
      TTL: payload.ttl || 3600, // Time to live in seconds (default 1 hour)
      urgency: payload.urgency || 'normal', // 'very-low', 'low', 'normal', 'high'
      topic: payload.topic || null
    };

    await webpush.sendNotification(subscription, notificationPayload, options);
    
    return {
      success: true,
      message: 'Push notification sent successfully'
    };
  } catch (error) {
    console.error('Push notification error:', error);
    
    // Handle expired subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      return {
        success: false,
        expired: true,
        error: 'Subscription expired or invalid'
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send push notification to multiple subscriptions
 * @param {Array} subscriptions - Array of push subscriptions
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Batch send results
 */
async function sendBatchPushNotifications(subscriptions, payload) {
  if (!webpush || !config.VAPID_PUBLIC_KEY) {
    return {
      success: false,
      error: 'Push notifications not configured'
    };
  }

  const results = {
    total: subscriptions.length,
    sent: 0,
    failed: 0,
    expired: 0,
    errors: []
  };

  const sendPromises = subscriptions.map(async (subscription, index) => {
    try {
      const result = await sendPushNotification(subscription, payload);
      
      if (result.success) {
        results.sent++;
      } else if (result.expired) {
        results.expired++;
      } else {
        results.failed++;
        results.errors.push({
          subscriptionIndex: index,
          error: result.error
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        subscriptionIndex: index,
        error: error.message
      });
    }
  });

  await Promise.allSettled(sendPromises);

  return results;
}

/**
 * Send push notification to user by ID
 * @param {string} userId - User ID
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Send result
 */
async function sendPushToUser(userId, payload) {
  // Get user's push subscriptions from database
  const { PushSubscription } = require('../modules/notification/pushSubscription.model');
  
  const subscriptions = await PushSubscription.find({
    user: userId,
    active: true
  });

  if (subscriptions.length === 0) {
    return {
      success: false,
      error: 'No active push subscriptions found for user'
    };
  }

  // Send to all user's subscriptions (multiple devices)
  const results = await sendBatchPushNotifications(
    subscriptions.map(sub => sub.subscription),
    payload
  );

  // Mark expired subscriptions as inactive
  if (results.expired > 0) {
    await PushSubscription.updateMany(
      {
        user: userId,
        active: true,
        _id: { $in: results.errors
          .filter(e => e.expired)
          .map(e => subscriptions[e.subscriptionIndex]._id)
        }
      },
      { active: false }
    );
  }

  return results;
}

/**
 * Create notification payload from notification type
 * @param {Object} notification - Notification object from database
 * @returns {Object} Push notification payload
 */
function createPayloadFromNotification(notification) {
  const baseUrl = config.FRONTEND_URL || 'https://kmit-clubs.in';
  
  // Map notification types to push notification payloads
  const typeMap = {
    recruitment_open: {
      title: 'New Recruitment Open',
      body: `${notification.payload.clubName || 'A club'} is now recruiting!`,
      icon: '/icons/recruitment.png',
      data: {
        url: `${baseUrl}/recruitments/${notification.payload.recruitmentId}`,
        type: 'recruitment_open'
      },
      tag: 'recruitment',
      requireInteraction: true
    },
    recruitment_closing: {
      title: 'Recruitment Closing Soon',
      body: `${notification.payload.clubName || 'Recruitment'} closes in ${notification.payload.hoursLeft} hours`,
      icon: '/icons/warning.png',
      data: {
        url: `${baseUrl}/recruitments/${notification.payload.recruitmentId}`,
        type: 'recruitment_closing'
      },
      tag: 'recruitment-closing',
      urgency: 'high'
    },
    application_status: {
      title: 'Application Update',
      body: `Your application status: ${notification.payload.status}`,
      icon: '/icons/application.png',
      data: {
        url: `${baseUrl}/my-applications`,
        type: 'application_status'
      },
      tag: 'application'
    },
    event_reminder: {
      title: 'Event Reminder',
      body: `${notification.payload.eventName} starts in ${notification.payload.hoursUntil} hours`,
      icon: '/icons/event.png',
      data: {
        url: `${baseUrl}/events/${notification.payload.eventId}`,
        type: 'event_reminder'
      },
      tag: 'event-reminder'
    },
    approval_required: {
      title: 'Approval Required',
      body: notification.payload.message || 'Action required',
      icon: '/icons/approval.png',
      data: {
        url: `${baseUrl}/approvals`,
        type: 'approval_required'
      },
      tag: 'approval',
      requireInteraction: true,
      urgency: 'high'
    },
    role_assigned: {
      title: 'New Role Assigned',
      body: `You've been assigned the role: ${notification.payload.role}`,
      icon: '/icons/role.png',
      data: {
        url: `${baseUrl}/profile`,
        type: 'role_assigned'
      },
      tag: 'role'
    },
    system_maintenance: {
      title: 'System Notification',
      body: notification.payload.message || 'Important system update',
      icon: '/icons/system.png',
      data: {
        url: baseUrl,
        type: 'system_maintenance'
      },
      tag: 'system',
      requireInteraction: notification.priority === 'URGENT'
    }
  };

  return typeMap[notification.type] || {
    title: 'KMIT Clubs Hub',
    body: 'You have a new notification',
    icon: '/icons/default.png',
    data: { url: baseUrl },
    tag: 'default'
  };
}

/**
 * Check if push notifications are enabled
 * @returns {boolean} True if push is available
 */
function isPushAvailable() {
  return !!webpush && !!config.VAPID_PUBLIC_KEY;
}

/**
 * Get VAPID public key for client subscription
 * @returns {string|null} VAPID public key or null
 */
function getVapidPublicKey() {
  return config.VAPID_PUBLIC_KEY || null;
}

module.exports = {
  sendPushNotification,
  sendBatchPushNotifications,
  sendPushToUser,
  createPayloadFromNotification,
  isPushAvailable,
  getVapidPublicKey
};
