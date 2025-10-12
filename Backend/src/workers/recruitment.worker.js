const { Worker, JobsOptions } = require('bullmq');
const config = { connection: { url: process.env.REDIS_URL } };
const recruitmentService = require('../modules/recruitment/recruitment.service');

const concurrency = Number(process.env.RECRUITMENT_WORKER_CONCURRENCY || 5);

const backoff = { type: 'exponential', delay: 2000 };

const worker = new Worker(
  'recruitment',
  async (job) => {
    const id = job.data.id;
    const ctx = { id: null, ip: '0.0.0.0', userAgent: 'scheduler' };
    if (job.name === 'open') {
      await recruitmentService.changeStatus(id, 'open', ctx);
    } else if (job.name === 'warn24h') {
      await recruitmentService.changeStatus(id, 'closeSoon', ctx);
    } else if (job.name === 'close') {
      await recruitmentService.changeStatus(id, 'close', ctx);
    }
  },
  { ...config, concurrency, settings: { backoffStrategies: {} } }
);

worker.on('failed', (job, err) => {
  console.error('Recruitment worker failed', job?.id, job?.name, err?.message);
});

module.exports = worker;
