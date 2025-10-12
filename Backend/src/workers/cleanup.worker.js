/**
 * Cleanup Worker - Periodic database cleanup tasks
 * Handles expired sessions, old OTPs, temporary files, etc.
 */

const mongoose = require('mongoose');
const config = require('../config');
const { Session } = require('../modules/auth/session.model');
const { PasswordReset } = require('../modules/auth/passwordReset.model');

const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Clean expired sessions
 */
async function cleanExpiredSessions() {
  try {
    const result = await Session.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned ${result.deletedCount} expired sessions`);
    }
    
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning sessions:', error);
    return 0;
  }
}

/**
 * Clean expired password reset tokens
 */
async function cleanExpiredResets() {
  try {
    const result = await PasswordReset.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned ${result.deletedCount} expired password resets`);
    }
    
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning password resets:', error);
    return 0;
  }
}

/**
 * Clean old audit logs (older than retention period)
 */
async function cleanOldAuditLogs() {
  try {
    const AuditLog = require('../modules/audit/auditLog.model').AuditLog;
    const retentionDays = config.AUDIT_LOG_RETENTION_DAYS || 730; // 2 years default
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Archive to separate collection before deleting (optional)
    const oldLogs = await AuditLog.find({ 
      createdAt: { $lt: cutoffDate } 
    }).limit(1000).lean();
    
    if (oldLogs.length > 0) {
      // Could archive to AuditLogArchive collection here
      const result = await AuditLog.deleteMany({
        createdAt: { $lt: cutoffDate }
      });
      
      console.log(`🧹 Cleaned ${result.deletedCount} old audit logs (older than ${retentionDays} days)`);
      return result.deletedCount;
    }
    
    return 0;
  } catch (error) {
    console.error('Error cleaning audit logs:', error);
    return 0;
  }
}

/**
 * Clean incomplete registrations (pending OTP for > 24 hours)
 */
async function cleanStaleRegistrations() {
  try {
    const { User } = require('../modules/auth/user.model');
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const result = await User.deleteMany({
      status: 'pending_otp',
      createdAt: { $lt: oneDayAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned ${result.deletedCount} stale registrations`);
    }
    
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning stale registrations:', error);
    return 0;
  }
}

/**
 * Run all cleanup tasks
 */
async function runCleanup() {
  console.log('🧹 Starting cleanup tasks...');
  
  const tasks = [
    cleanExpiredSessions(),
    cleanExpiredResets(),
    cleanOldAuditLogs(),
    cleanStaleRegistrations()
  ];
  
  const results = await Promise.allSettled(tasks);
  
  const totalCleaned = results.reduce((sum, result) => {
    return sum + (result.status === 'fulfilled' ? result.value : 0);
  }, 0);
  
  console.log(`✅ Cleanup completed. Total items cleaned: ${totalCleaned}`);
  
  return totalCleaned;
}

/**
 * Start cleanup worker with periodic execution
 */
async function startCleanupWorker() {
  console.log('🚀 Cleanup worker started');
  console.log(`   Interval: ${CLEANUP_INTERVAL / 1000 / 60} minutes`);
  
  // Run immediately on start
  await runCleanup();
  
  // Schedule periodic cleanup
  const interval = setInterval(async () => {
    try {
      await runCleanup();
    } catch (error) {
      console.error('Cleanup task failed:', error);
    }
  }, CLEANUP_INTERVAL);
  
  return interval;
}

// If run directly
if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(config.MONGODB_URI);
      console.log('✅ MongoDB connected for cleanup worker');
      
      await startCleanupWorker();
      
      // Handle graceful shutdown
      process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down cleanup worker...');
        await mongoose.connection.close();
        process.exit(0);
      });
      
      process.on('SIGINT', async () => {
        console.log('SIGINT received, shutting down cleanup worker...');
        await mongoose.connection.close();
        process.exit(0);
      });
    } catch (error) {
      console.error('Cleanup worker startup failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  runCleanup,
  startCleanupWorker,
  cleanExpiredSessions,
  cleanExpiredResets,
  cleanOldAuditLogs,
  cleanStaleRegistrations
};
