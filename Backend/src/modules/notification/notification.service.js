const { Notification }     = require('./notification.model');
const notificationQueue    = require('../../queues/notification.queue');

class NotificationService {
  /**
   * Create & enqueue a notification.
   * @param {Object} opts: { user, type, payload, priority }
   */
  async create({ user, type, payload = {}, priority = 'MEDIUM' }) {
    const notif = await Notification.create({ user, type, payload, priority });
    if (!notificationQueue || typeof notificationQueue.add !== 'function') {
      console.error('notificationQueue is not properly initialized:', notificationQueue);
      throw new Error('Notification queue is not available');
    }
    await notificationQueue.add('send', { notifId: notif._id });
    return notif;
  }

  async list(userId, { page = 1, limit = 20, type, priority, isRead }) {
    const query = { user: userId };
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
    return { total, page, limit, items };
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