const mongoose = require('mongoose');
const redis = require('../../config/redis');

async function checkMongo() {
  try {
    const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    return { ok: state === 1, state };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function checkRedis() {
  try {
    const pong = await redis.ping();
    return { ok: pong === 'PONG' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

exports.getReadiness = async () => {
  const [mongo, redisStatus] = await Promise.all([checkMongo(), checkRedis()]);
  const allOk = mongo.ok && redisStatus.ok;
  return {
    ok: allOk,
    uptime: process.uptime(),
    timestamp: Date.now(),
    mongo,
    redis: redisStatus,
  };
};

exports.getLiveness = () => ({
  ok: true,
  uptime: process.uptime(),
  timestamp: Date.now(),
});
