const { Notification }     = require('./notification.model');
const notificationQueue    = require('../../queues/notification.queue');

class NotificationService {
  /**
   * Create & enqueue a notification.
   * Includes deduplication to prevent duplicate notifications within 1 hour.
   * @param {Object} opts: { user, type, payload, priority }
   */
  async create({ user, type, payload = {}, priority = 'MEDIUM' }) {
    // Deduplication: Check for similar notification created in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const existingNotif = await Notification.findOne({
      user,
      type,
      createdAt: { $gte: oneHourAgo },
      // For role_assigned, also check if payload is similar
      ...(type === 'role_assigned' && payload.role ? { 'payload.role': payload.role } : {})
    }).sort({ createdAt: -1 });

    // If duplicate found within last hour, return existing instead of creating new
    if (existingNotif) {
      console.log(`[Notification] Duplicate prevented: ${type} for user ${user}`);
      return existingNotif;
    }

    // Create new notification
    const notif = await Notification.create({ user, type, payload, priority });
    if (!notificationQueue || typeof notificationQueue.add !== 'function') {
      console.error('notificationQueue is not properly initialized:', notificationQueue);
      throw new Error('Notification queue is not available');
    }
    await notificationQueue.add('send', { notifId: notif._id });
    return notif;
  }

  async list(userId, { page = 1, limit = 20, type, priority, isRead, includeOlder = false }) {
    const query = { user: userId };
    
    // Workplan Line 362: Last 30 days visible by default, pagination for older
    if (!includeOlder) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: thirtyDaysAgo };
    }
    
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (typeof isRead === 'boolean') query.isRead = isRead;
    
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      Notification.countDocuments(query),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);
    
    return { 
      total, 
      page, 
      limit, 
      items,
      hasOlder: !includeOlder && await this.hasOlderNotifications(userId)
    };
  }
  
  /**
   * Check if user has notifications older than 30 days
   */
  async hasOlderNotifications(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await Notification.countDocuments({
      user: userId,
      createdAt: { $lt: thirtyDaysAgo }
    });
    return count > 0;
  }

  async markRead(userId, id, isRead) {
    const notif = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead },
      { new: true }
    );
    if (!notif) throw Object.assign(new Error('Not found'), { statusCode: 404 });
    return notif;
  }

  async markAllRead(userId) {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }

  async countUnread(userId) {
    return Notification.countDocuments({ user: userId, isRead: false });
  }
}

module.exports = new NotificationService();