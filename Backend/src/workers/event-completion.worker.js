// src/workers/event-completion.worker.js
/**
 * Event Completion Checker Worker
 * Workplan Line 316: After 7 days → marked "incomplete"
 * 
 * Runs daily to check events that have ended but haven't been marked as completed
 * If 7 days have passed since event date, mark as 'incomplete'
 */

const cron = require('node-cron');
const { Event } = require('../modules/event/event.model');
const notificationService = require('../modules/notification/notification.service');
const { sendMail } = require('../utils/mail');
const config = require('../../config');

/**
 * Check and mark incomplete events
 */
async function checkIncompleteEvents() {
  try {
    console.log('[Event Completion Worker] Starting incomplete event check...');
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    // Find events that:
    // 1. Have status 'ongoing' or 'approved' or 'published'
    // 2. Event date was more than 7 days ago
    // 3. Haven't been marked as completed or incomplete
    const eventsToCheck = await Event.find({
      status: { $in: ['ongoing', 'approved', 'published'] },
      dateTime: { $lt: sevenDaysAgo },
      $or: [
        { reportSubmittedAt: { $exists: false } },
        { reportSubmittedAt: null }
      ]
    }).populate('club', 'name').lean();
    
    console.log(`[Event Completion Worker] Found ${eventsToCheck.length} events to check`);
    
    const results = {
      total: eventsToCheck.length,
      markedIncomplete: 0,
      notificationsSent: 0,
      errors: []
    };
    
    for (const event of eventsToCheck) {
      try {
        // Calculate days since event
        const daysSinceEvent = Math.floor((now - new Date(event.dateTime)) / (1000 * 60 * 60 * 24));
        
        // Mark event as incomplete (Workplan Line 316)
        await Event.findByIdAndUpdate(event._id, {
          status: 'archived', // Use archived status with incomplete flag
          $set: {
            'metadata.incompleteReason': 'Post-event requirements not submitted within 7 days',
            'metadata.markedIncompleteAt': now,
            'metadata.daysSinceEvent': daysSinceEvent
          }
        });
        
        results.markedIncomplete++;
        
        // Get club president and core members to notify
        const { Membership } = require('../modules/club/membership.model');
        const coreMembers = await Membership.find({
          club: event.club._id,
          role: { $in: ['president', 'core', 'vicePresident', 'secretary'] },
          status: 'approved'
        }).select('user');
        
        // Send notifications to core members
        for (const member of coreMembers) {
          try {
            await notificationService.create({
              user: member.user,
              type: 'system_maintenance',
              payload: {
                reason: 'event_incomplete',
                eventId: event._id,
                eventName: event.title,
                clubName: event.club?.name,
                daysSinceEvent
              },
              priority: 'HIGH'
            });
            
            results.notificationsSent++;
          } catch (notifError) {
            console.error(`Failed to send notification for event ${event._id}:`, notifError);
          }
        }
        
        // Send email to club coordinator if available
        if (event.club && event.club.coordinator) {
          try {
            const { User } = require('../modules/auth/user.model');
            const coordinator = await User.findById(event.club.coordinator);
            
            if (coordinator) {
              await sendMail({
                to: coordinator.email,
                subject: `Event Marked Incomplete: ${event.title}`,
                html: `
                  <h2>Event Marked as Incomplete</h2>
                  <p>The following event has been automatically marked as incomplete due to missing post-event requirements:</p>
                  <ul>
                    <li><strong>Event:</strong> ${event.title}</li>
                    <li><strong>Club:</strong> ${event.club?.name}</li>
                    <li><strong>Event Date:</strong> ${new Date(event.dateTime).toLocaleDateString()}</li>
                    <li><strong>Days Since Event:</strong> ${daysSinceEvent}</li>
                  </ul>
                  <p><strong>Missing Requirements:</strong></p>
                  <ul>
                    ${!event.photos || event.photos.length < 5 ? '<li>Minimum 5 photos</li>' : ''}
                    ${!event.attendanceUrl ? '<li>Attendance sheet</li>' : ''}
                    ${!event.reportUrl && !event.reportSubmittedAt ? '<li>Event report</li>' : ''}
                    ${event.budget > 0 && (!event.billsUrls || event.billsUrls.length === 0) ? '<li>Bills/receipts</li>' : ''}
                  </ul>
                  <p>Please contact the club president to ensure all post-event requirements are submitted for future events.</p>
                  <p><a href="${config.FRONTEND_URL}/events/${event._id}">View Event</a></p>
                `
              });
            }
          } catch (emailError) {
            console.error(`Failed to send email for event ${event._id}:`, emailError);
          }
        }
        
        console.log(`[Event Completion Worker] Marked event ${event._id} as incomplete (${daysSinceEvent} days since event)`);
        
      } catch (eventError) {
        console.error(`Error processing event ${event._id}:`, eventError);
        results.errors.push({
          eventId: event._id,
          error: eventError.message
        });
      }
    }
    
    console.log('[Event Completion Worker] Incomplete event check completed:', results);
    
    return results;
    
  } catch (error) {
    console.error('[Event Completion Worker] Error in incomplete event check:', error);
    throw error;
  }
}

/**
 * Send reminder notifications before marking incomplete (3 days warning)
 */
async function sendCompletionReminders() {
  try {
    console.log('[Event Completion Worker] Sending completion reminders...');
    
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    // Find events that are 4 days old but haven't been completed
    const eventsNeedingReminder = await Event.find({
      status: { $in: ['ongoing', 'approved', 'published'] },
      dateTime: { $gte: fourDaysAgo, $lt: threeDaysAgo },
      $or: [
        { reportSubmittedAt: { $exists: false } },
        { reportSubmittedAt: null }
      ],
      'metadata.reminderSentAt': { $exists: false }
    }).populate('club', 'name coordinator');
    
    console.log(`[Event Completion Worker] Found ${eventsNeedingReminder.length} events needing reminders`);
    
    let remindersSent = 0;
    
    for (const event of eventsNeedingReminder) {
      try {
        // Get club core members
        const { Membership } = require('../modules/club/membership.model');
        const coreMembers = await Membership.find({
          club: event.club._id,
          role: { $in: ['president', 'core', 'vicePresident', 'secretary'] },
          status: 'approved'
        }).select('user');
        
        // Send reminder notifications
        for (const member of coreMembers) {
          await notificationService.create({
            user: member.user,
            type: 'system_maintenance',
            payload: {
              reason: 'event_completion_reminder',
              eventId: event._id,
              eventName: event.title,
              clubName: event.club?.name,
              daysRemaining: 3
            },
            priority: 'HIGH'
          });
        }
        
        // Mark reminder as sent
        await Event.findByIdAndUpdate(event._id, {
          $set: { 'metadata.reminderSentAt': new Date() }
        });
        
        remindersSent++;
        
      } catch (reminderError) {
        console.error(`Failed to send reminder for event ${event._id}:`, reminderError);
      }
    }
    
    console.log(`[Event Completion Worker] Sent ${remindersSent} completion reminders`);
    
    return { remindersSent };
    
  } catch (error) {
    console.error('[Event Completion Worker] Error sending completion reminders:', error);
    throw error;
  }
}

/**
 * Start the event completion checker worker
 * Runs daily at 2 AM
 */
function startEventCompletionWorker() {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Event Completion Worker] Running daily check...');
    try {
      // First send reminders for events that are 4 days old
      await sendCompletionReminders();
      
      // Then mark incomplete events that are 7+ days old
      await checkIncompleteEvents();
    } catch (error) {
      console.error('[Event Completion Worker] Daily check failed:', error);
    }
  });
  
  console.log('[Event Completion Worker] Worker started - runs daily at 2:00 AM');
}

// If running as standalone worker
if (require.main === module) {
  const mongoose = require('mongoose');
  const dbConfig = require('../config/db');
  
  mongoose.connect(config.MONGODB_URI)
    .then(() => {
      console.log('Database connected');
      startEventCompletionWorker();
      
      // Run immediately for testing
      if (process.env.RUN_IMMEDIATE === 'true') {
        sendCompletionReminders()
          .then(() => checkIncompleteEvents())
          .then(results => {
            console.log('Immediate run completed:', results);
          })
          .catch(error => {
            console.error('Immediate run failed:', error);
            process.exit(1);
          });
      }
    })
    .catch(error => {
      console.error('Database connection failed:', error);
      process.exit(1);
    });
}

module.exports = {
  checkIncompleteEvents,
  sendCompletionReminders,
  startEventCompletionWorker
};
