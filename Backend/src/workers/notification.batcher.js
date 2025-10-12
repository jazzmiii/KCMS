const { Queue } = require('bullmq');

const config = require('../config');
const cfg = { connection: { url: config.REDIS_URL } };
const notificationQueue = new Queue('notification', cfg);

async function scheduleBatching() {
  const every = config.NOTIFICATION_BATCH_EVERY_MS;
  await notificationQueue.add(
    'flushBatch',
    {},
    {
      repeat: { every },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
  return every;
}

module.exports = { scheduleBatching };
