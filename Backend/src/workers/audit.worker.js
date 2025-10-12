const { Worker } = require('bullmq');
const appConfig = require('../config');
const config = { connection: { url: appConfig.REDIS_URL } };
const { AuditLog } = require('../modules/audit/auditLog.model');

const concurrency = appConfig.AUDIT_WORKER_CONCURRENCY;

const worker = new Worker(
  'audit',
  async (job) => {
    await AuditLog.create(job.data);
  },
  { ...config, concurrency }
);

worker.on('failed', (job, err) => {
  console.error('Audit worker failed', job?.id, err?.message);
});

module.exports = worker;
