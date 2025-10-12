const IORedis = require('ioredis');

const url = process.env.REDIS_URL;

const redis = new IORedis(url, {
  // Reconnect with backoff up to 10s
  retryStrategy(times) {
    const delay = Math.min(1000 * Math.pow(2, times), 10000);
    return delay;
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

redis.on('error', (e) => {
  // Centralized minimal logging; prefer your logger if wired
  console.error('Redis error:', e.message);
});

module.exports = redis;
