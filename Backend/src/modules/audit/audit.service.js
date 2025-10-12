// src/modules/audit/audit.service.js
const auditQueue = require('../../queues/audit.queue');
const mongoose = require('mongoose');

class AuditService {
  /**
   * Enqueue an audit log entry for asynchronous persistence.
   * @param {Object} entry  keys: user, action, target, oldValue, newValue, ip, userAgent
   */
  async log(entry) {
    if (!auditQueue || typeof auditQueue.add !== 'function') {
      console.error('auditQueue is not properly initialized:', auditQueue);
      throw new Error('Audit queue is not available');
    }
    await auditQueue.add('log', entry);
  }

  /**
   * Synchronously query audit logs (no queue).
   * @param {Object} filters  page, limit, user, action, from, to
   */
  async list(filters) {
    const { user, action, from, to, page = 1, limit = 20 } = filters;
    const query = {};
    if (user)   query.user = user;
    if (action) query.action = action;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to)   query.createdAt.$lte = new Date(to);
    }
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      mongoose.model('AuditLog').countDocuments(query),
      mongoose.model('AuditLog')
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);
    return { total, page, limit, items };
  }
}

module.exports = new AuditService();