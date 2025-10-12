/**
 * Recruitment Scheduler - Checks and schedules recruitment lifecycle jobs
 * Run this as a CRON job every hour or integrate into server startup
 */

const { Recruitment } = require('../modules/recruitment/recruitment.model');
const recruitmentQueue = require('../queues/recruitment.queue');

/**
 * Schedule jobs for upcoming recruitments
 */
async function scheduleUpcomingRecruitments() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Find scheduled recruitments that should open
    const toOpen = await Recruitment.find({
      status: 'scheduled',
      startDate: { $lte: now }
    });

    for (const rec of toOpen) {
      await recruitmentQueue.add('open', { id: rec._id.toString() });
      console.log(`📅 Scheduled 'open' for recruitment: ${rec.title}`);
    }

    // Find open recruitments that close in 24 hours (warn)
    const toWarn = await Recruitment.find({
      status: 'open',
      endDate: { $gte: now, $lte: tomorrow },
      _warned24h: { $ne: true }
    });

    for (const rec of toWarn) {
      await recruitmentQueue.add('warn24h', { id: rec._id.toString() });
      rec._warned24h = true;
      await rec.save();
      console.log(`⚠️  Scheduled '24h warning' for recruitment: ${rec.title}`);
    }

    // Find open recruitments that should close
    const toClose = await Recruitment.find({
      status: 'open',
      endDate: { $lt: now }
    });

    for (const rec of toClose) {
      await recruitmentQueue.add('close', { id: rec._id.toString() });
      console.log(`🔒 Scheduled 'close' for recruitment: ${rec.title}`);
    }

    const total = toOpen.length + toWarn.length + toClose.length;
    if (total > 0) {
      console.log(`✅ Scheduled ${total} recruitment lifecycle jobs`);
    }

    return { opened: toOpen.length, warned: toWarn.length, closed: toClose.length };
  } catch (error) {
    console.error('❌ Recruitment scheduler error:', error);
    throw error;
  }
}

/**
 * Start scheduler with interval
 */
function startRecruitmentScheduler(intervalMs = 60000) {
  console.log('🚀 Recruitment lifecycle scheduler started');
  console.log(`   Interval: ${intervalMs / 1000} seconds`);

  // Run immediately
  scheduleUpcomingRecruitments();

  // Run periodically
  const interval = setInterval(() => {
    scheduleUpcomingRecruitments().catch(err => {
      console.error('Scheduler error:', err);
    });
  }, intervalMs);

  return interval;
}

module.exports = {
  scheduleUpcomingRecruitments,
  startRecruitmentScheduler
};
