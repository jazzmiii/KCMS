/**
 * Notification Batcher
 * Schedules periodic batch email processing for MEDIUM/LOW priority notifications
 */

const { Queue } = require('bullmq');
const config = require('../config');
const cron = require('node-cron');

const notificationQueue = new Queue('notification', {
  connection: { url: config.REDIS_URL }
});

// Schedule batching every 4 hours using cron (at 0, 4, 8, 12, 16, 20 hours)
const batchSchedule = '0 */4 * * *'; // Every 4 hours on the hour

function startNotificationBatcher() {
  console.log('\ud83d\ude80 Notification batcher started');
  console.log(`   Schedule: Every 4 hours (${batchSchedule})`);

  // Schedule using cron for more reliable timing
  cron.schedule(batchSchedule, async () => {
    try {
      console.log('📧 Scheduling batch notification job...');
      await notificationQueue.add('flushBatch', {}, {
        priority: 10, // Higher priority than individual notifications
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
      console.log('✅ Batch notification job added to queue');
    } catch (error) {
      console.error('❌ Failed to schedule batch job:', error);
    }
  });

  // Also run immediately on startup
  notificationQueue.add('flushBatch', {}, { priority: 10 })
    .then(() => console.log('✅ Initial batch job scheduled'))
    .catch(err => console.error('❌ Initial batch job failed:', err));
}

// Start batcher if this file is run directly
if (require.main === module) {
  startNotificationBatcher();
  
  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down notification batcher...');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down notification batcher...');
    process.exit(0);
  });
}

module.exports = { startNotificationBatcher };
