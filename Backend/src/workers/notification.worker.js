const { Worker } = require('bullmq');
const appConfig = require('../config');
const config = { connection: { url: appConfig.REDIS_URL } };
const { Notification } = require('../modules/notification/notification.model');
const { sendMail } = require('../utils/mail');

const concurrency = appConfig.NOTIFICATION_WORKER_CONCURRENCY;

function renderEmail(notif) {
  const subject = `[${notif.priority}] ${notif.type}`;
  const payload = typeof notif.payload === 'object' ? JSON.stringify(notif.payload, null, 2) : String(notif.payload);
  const html = `<pre>${payload}</pre>`;
  const text = payload;
  return { subject, html, text };
}

const worker = new Worker(
  'notification',
  async (job) => {
    const { notifId } = job.data;
    const notif = await Notification.findById(notifId).populate('user', 'email').lean();
    if (!notif || !notif.user?.email) return;

    if (notif.priority === 'URGENT') {
      const { subject, html, text } = renderEmail(notif);
      await sendMail({ to: notif.user.email, subject, html, text });
    } else {
      if (job.name === 'flushBatch') {
        // TODO: fetch non-urgent queued notifications and send in batches
        return;
      }
      // Optionally, mark as queued for batch in DB here
      // console.log(`Queued for batch: ${notif.type} → ${notif.user.email}`);
    }
  },
  { ...config, concurrency }
);

worker.on('failed', (job, err) => {
  console.error('Notification worker failed', job?.id, job?.name, err?.message);
});

module.exports = worker;
