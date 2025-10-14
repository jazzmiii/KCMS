// src/modules/audit/audit.service.js
const auditQueue = require('../../queues/audit.queue');
const mongoose = require('mongoose');

// Audit Action Constants
const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTER: 'USER_REGISTER',
  
  // User Management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  
  // Club Management
  CLUB_CREATE: 'CLUB_CREATE',
  CLUB_UPDATE: 'CLUB_UPDATE',
  CLUB_DELETE: 'CLUB_DELETE',
  CLUB_BANNER_UPLOAD: 'CLUB_BANNER_UPLOAD',
  
  // Membership
  MEMBERSHIP_CREATE: 'MEMBERSHIP_CREATE',
  MEMBERSHIP_APPROVE: 'MEMBERSHIP_APPROVE',
  MEMBERSHIP_REJECT: 'MEMBERSHIP_REJECT',
  MEMBERSHIP_ROLE_CHANGE: 'MEMBERSHIP_ROLE_CHANGE',
  
  // Events
  EVENT_CREATE: 'EVENT_CREATE',
  EVENT_UPDATE: 'EVENT_UPDATE',
  EVENT_DELETE: 'EVENT_DELETE',
  EVENT_STATUS_CHANGE: 'EVENT_STATUS_CHANGE',
  
  // Financial
  BUDGET_REQUEST_CREATE: 'BUDGET_REQUEST_CREATE',
  BUDGET_REQUEST_APPROVE: 'BUDGET_REQUEST_APPROVE',
  BUDGET_REQUEST_REJECT: 'BUDGET_REQUEST_REJECT',
  COORDINATOR_FINANCIAL_OVERRIDE: 'COORDINATOR_FINANCIAL_OVERRIDE',
  
  // Settings
  SYSTEM_SETTINGS_UPDATE: 'SYSTEM_SETTINGS_UPDATE',
  SYSTEM_SETTINGS_RESET: 'SYSTEM_SETTINGS_RESET',
  
  // Reports
  REPORT_GENERATE: 'REPORT_GENERATE'
};

// Severity Levels
const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

class AuditService {
  constructor() {
    this.ACTIONS = AUDIT_ACTIONS;
    this.SEVERITY = SEVERITY;
  }

  /**
   * Enqueue an audit log entry for asynchronous persistence.
   * @param {Object} entry  keys: user, action, target, oldValue, newValue, ip, userAgent, severity, status, errorMessage, metadata
   */
  async log(entry) {
    // Set default severity if not provided
    if (!entry.severity) {
      entry.severity = this.determineSeverity(entry.action);
    }
    
    if (!auditQueue || typeof auditQueue.add !== 'function') {
      console.error('auditQueue is not properly initialized:', auditQueue);
      throw new Error('Audit queue is not available');
    }
    await auditQueue.add('log', entry);
  }

  /**
   * Determine severity based on action type
   */
  determineSeverity(action) {
    const criticalActions = [
      'USER_DELETE',
      'USER_ROLE_CHANGE',
      'CLUB_DELETE',
      'SYSTEM_SETTINGS_RESET',
      'COORDINATOR_FINANCIAL_OVERRIDE'
    ];
    
    const highActions = [
      'USER_CREATE',
      'CLUB_CREATE',
      'MEMBERSHIP_ROLE_CHANGE',
      'BUDGET_REQUEST_APPROVE',
      'BUDGET_REQUEST_REJECT',
      'SYSTEM_SETTINGS_UPDATE'
    ];
    
    const lowActions = [
      'USER_LOGIN',
      'USER_LOGOUT',
      'EVENT_CREATE'
    ];
    
    if (criticalActions.includes(action)) return SEVERITY.CRITICAL;
    if (highActions.includes(action)) return SEVERITY.HIGH;
    if (lowActions.includes(action)) return SEVERITY.LOW;
    return SEVERITY.MEDIUM;
  }

  /**
   * Synchronously query audit logs with enhanced filtering
   * @param {Object} filters  page, limit, user, action, from, to, severity, status
   */
  async list(filters) {
    const { user, action, from, to, severity, status, page = 1, limit = 20 } = filters;
    const query = {};
    
    if (user) query.user = user;
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      mongoose.model('AuditLog').countDocuments(query),
      mongoose.model('AuditLog')
        .find(query)
        .populate('user', 'profile.name email rollNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);
    
    return { total, page, limit, items };
  }

  /**
   * Get audit statistics
   */
  async getStatistics(filters = {}) {
    const { from, to } = filters;
    const query = {};
    
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    
    const [
      totalLogs,
      bySeverity,
      byAction,
      byStatus,
      topUsers
    ] = await Promise.all([
      mongoose.model('AuditLog').countDocuments(query),
      
      mongoose.model('AuditLog').aggregate([
        { $match: query },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      
      mongoose.model('AuditLog').aggregate([
        { $match: query },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      mongoose.model('AuditLog').aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      mongoose.model('AuditLog').aggregate([
        { $match: query },
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    return {
      totalLogs,
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byAction: byAction.map(item => ({
        action: item._id,
        count: item.count
      })),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topUsers: topUsers.map(item => ({
        user: item._id,
        count: item.count
      }))
    };
  }

  /**
   * Get recent critical/high severity logs
   */
  async getRecentCritical(limit = 20) {
    return await mongoose.model('AuditLog')
      .find({ severity: { $in: ['CRITICAL', 'HIGH'] } })
      .populate('user', 'profile.name email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get logs for specific user
   */
  async getUserActivity(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    const [total, items] = await Promise.all([
      mongoose.model('AuditLog').countDocuments({ user: userId }),
      mongoose.model('AuditLog')
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);
    
    return { total, page, limit, items };
  }

  /**
   * Export audit logs to CSV format
   */
  async exportToCSV(filters = {}) {
    const logs = await mongoose.model('AuditLog')
      .find(filters)
      .populate('user', 'profile.name email')
      .sort({ createdAt: -1 })
      .limit(10000); // Limit to prevent memory issues
    
    const csvRows = [
      ['Timestamp', 'User', 'Email', 'Action', 'Target', 'Severity', 'Status', 'IP Address'].join(',')
    ];
    
    logs.forEach(log => {
      csvRows.push([
        log.createdAt.toISOString(),
        log.user?.profile?.name || 'System',
        log.user?.email || 'N/A',
        log.action,
        log.target || 'N/A',
        log.severity,
        log.status,
        log.ip || 'N/A'
      ].join(','));
    });
    
    return csvRows.join('\n');
  }
}

module.exports = new AuditService();