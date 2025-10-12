/**
 * Event Report Enforcement Worker
 * Checks for events that need post-event reports and sends reminders
 * Marks events as incomplete if report not submitted within 7 days
 */

const { Event } = require('../modules/event/event.model');
const notificationService = require('../modules/notification/notification.service');
const { Membership } = require('../modules/club/membership.model');
const cron = require('node-cron');

/**
 * Check for overdue event reports and send reminders
 */
async function checkEventReports() {
  try {
    console.log('🔍 Checking for overdue event reports...');
    
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Find completed events without reports
    const eventsNeedingReports = await Event.find({
      status: 'completed',
      reportSubmittedAt: null,
      reportDueDate: { $lte: now }
    }).populate('club', 'name coordinator');
    
    let reminderCount = 0;
    let markedIncomplete = 0;
    
    for (const event of eventsNeedingReports) {
      const daysSinceCompletion = Math.floor(
        (now - event.reportDueDate) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceCompletion >= 7) {
        // Mark as incomplete after 7 days
        event.status = 'archived';
        event.incompleteReason = 'No post-event report submitted within 7 days';
        await event.save();
        markedIncomplete++;
        
        // Notify club coordinator and core members
        const coreMembers = await Membership.find({
          club: event.club._id,
          role: { $in: ['president', 'core'] },
          status: 'approved'
        }).distinct('user');
        
        await Promise.all([
          // Notify coordinator
          notificationService.create({
            user: event.club.coordinator,
            type: 'system_maintenance',
            payload: {
              eventId: event._id,
              eventTitle: event.title,
              message: 'Event marked as incomplete - no report submitted within 7 days'
            },
            priority: 'HIGH'
          }),
          // Notify core members
          ...coreMembers.map(userId =>
            notificationService.create({
              user: userId,
              type: 'system_maintenance',
              payload: {
                eventId: event._id,
                eventTitle: event.title,
                message: 'Event marked as incomplete - no report submitted'
              },
              priority: 'HIGH'
            })
          )
        ]);
        
        console.log(`❌ Event "${event.title}" marked as incomplete (${daysSinceCompletion} days overdue)`);
        
      } else if (daysSinceCompletion >= 3) {
        // Send reminder after 3 days
        const coreMembers = await Membership.find({
          club: event.club._id,
          role: { $in: ['president', 'core'] },
          status: 'approved'
        }).distinct('user');
        
        await Promise.all(coreMembers.map(userId =>
          notificationService.create({
            user: userId,
            type: 'event_reminder',
            payload: {
              eventId: event._id,
              eventTitle: event.title,
              daysRemaining: 7 - daysSinceCompletion,
              message: `Post-event report due soon. Submit within ${7 - daysSinceCompletion} days to avoid marking as incomplete.`
            },
            priority: 'HIGH'
          })
        ));
        
        reminderCount++;
        console.log(`⏰ Reminder sent for event "${event.title}" (${daysSinceCompletion} days since completion)`);
      }
    }
    
    console.log(`✅ Event report check completed: ${reminderCount} reminders, ${markedIncomplete} marked incomplete`);
    
    return { reminderCount, markedIncomplete };
  } catch (error) {
    console.error('❌ Event report check failed:', error);
    throw error;
  }
}

/**
 * Submit event report
 */
async function submitEventReport(eventId, reportData, userContext) {
  const event = await Event.findById(eventId);
  
  if (!event) {
    throw Object.assign(new Error('Event not found'), { statusCode: 404 });
  }
  
  if (event.status !== 'completed') {
    throw Object.assign(new Error('Event must be completed to submit report'), { statusCode: 400 });
  }
  
  // Update event with report data
  event.reportSubmittedAt = new Date();
  event.reportData = reportData; // Store report details
  await event.save();
  
  // Notify coordinator
  await notificationService.create({
    user: event.club?.coordinator,
    type: 'system_maintenance',
    payload: {
      eventId: event._id,
      eventTitle: event.title,
      message: 'Post-event report submitted successfully'
    },
    priority: 'MEDIUM'
  });
  
  console.log(`📋 Report submitted for event "${event.title}"`);
  
  return event;
}

/**
 * Start event report enforcement scheduler
 */
function startEventReportScheduler() {
  console.log('🚀 Event report scheduler started');
  console.log('   Schedule: Daily at 10:00 AM');
  
  // Run daily at 10 AM
  cron.schedule('0 10 * * *', async () => {
    try {
      await checkEventReports();
    } catch (error) {
      console.error('Event report check failed:', error);
    }
  });
  
  // Also run immediately on startup
  checkEventReports().catch(console.error);
}

// Start scheduler if run directly
if (require.main === module) {
  const mongoose = require('mongoose');
  const config = require('../config');
  
  (async () => {
    try {
      await mongoose.connect(config.MONGODB_URI);
      console.log('✅ MongoDB connected for event report worker');
      
      await startEventReportScheduler();
      
      // Handle graceful shutdown
      process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down event report worker...');
        await mongoose.connection.close();
        process.exit(0);
      });
      
      process.on('SIGINT', async () => {
        console.log('SIGINT received, shutting down event report worker...');
        await mongoose.connection.close();
        process.exit(0);
      });
    } catch (error) {
      console.error('Event report worker startup failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  checkEventReports,
  submitEventReport,
  startEventReportScheduler
};
