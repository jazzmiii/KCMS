const { QueueScheduler } = require('bullmq');

const config = { connection: { url: process.env.REDIS_URL } };

function startSchedulers() {
  // One scheduler per queue name
  const audit = new QueueScheduler('audit', config);
  const notification = new QueueScheduler('notification', config);
  const recruitment = new QueueScheduler('recruitment', config);

  // Optional: listen to errors
  audit.on('failed', (e) => console.error('Audit scheduler error', e));
  notification.on('failed', (e) => console.error('Notification scheduler error', e));
  recruitment.on('failed', (e) => console.error('Recruitment scheduler error', e));

  return { audit, notification, recruitment };
}

module.exports = { startSchedulers };