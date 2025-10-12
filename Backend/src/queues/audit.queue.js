// src/queues/audit.queue.js
const { Queue } = require('bullmq');
const config    = require('../../config');

const auditQueue = new Queue('audit', {
  connection: { url: config.REDIS_URL },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false
  }
});

module.exports = auditQueue;