// src/queues/audit.queue.js
const { Queue } = require('bullmq');
const config    = require('../config');

if (!config.REDIS_URL) {
  console.error('REDIS_URL is not configured for audit queue');
}

const auditQueue = new Queue('audit', {
  connection: { url: config.REDIS_URL },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false
  }
});

module.exports = auditQueue;