// src/queues/recruitment.queue.js
const { Queue } = require('bullmq');
const config    = require('../config');

const recruitmentQueue = new Queue('recruitment', {
  connection: { url: config.REDIS_URL }
});

module.exports = recruitmentQueue;