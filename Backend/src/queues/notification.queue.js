const { Queue } = require('bullmq');
const config    = require('../../config');

const notificationQueue = new Queue('notification', {
  connection: { url: config.REDIS_URL }
});

module.exports = notificationQueue;