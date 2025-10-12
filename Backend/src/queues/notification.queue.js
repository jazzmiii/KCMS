const { Queue } = require('bullmq');
const config    = require('../config');

if (!config.REDIS_URL) {
  console.error('REDIS_URL is not configured for notification queue');
}

const notificationQueue = new Queue('notification', {
  connection: { url: config.REDIS_URL }
});

module.exports = notificationQueue;