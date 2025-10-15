// src/modules/event/event.service.js
const { Event }         = require('./event.model');
const { Attendance }    = require('./attendance.model');
const { BudgetRequest } = require('./budgetRequest.model');
const cloudinary        = require('../../utils/cloudinary');
const { generateEventQR } = require('../../utils/qrcode');
const auditService      = require('../audit/audit.service');
const notificationSvc   = require('../notification/notification.service');
const { Membership }    = require('../club/membership.model');

class EventService {
  /**
   * Create a new event (draft).
   */
  async create(data, files, userContext) {
    const evt = new Event(data);

    // Handle attachments
    if (files.proposal) {
      const r = await cloudinary.uploadFile(files.proposal[0].path, { folder: 'events/proposals' });
      evt.attachments.proposalUrl = r.secure_url;
    }
    if (files.budgetBreakdown) {
      const r = await cloudinary.uploadFile(files.budgetBreakdown[0].path, { folder: 'events/budgets' });
      evt.attachments.budgetBreakdownUrl = r.secure_url;
    }
    if (files.venuePermission) {
      const r = await cloudinary.uploadFile(files.venuePermission[0].path, { folder: 'events/permissions' });
      evt.attachments.venuePermissionUrl = r.secure_url;
    }

    await evt.save();

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'EVENT_CREATE',
      target: `Event:${evt._id}`,
      newValue: evt.toObject(),
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    // ✅ Notification will be sent when event is SUBMITTED (changeStatus 'submit')
    // Not when created (status is 'draft')

    return evt;
  }

  /**
   * List events with pagination and filters.
   * ✅ Permission-based filtering:
   * - draft/pending_coordinator/pending_admin: Only visible to creator, assigned coordinator, or admin
   * - published/ongoing/completed: Visible to everyone
   */
  async list({ club, status, page = 1, limit = 20, upcoming, past }, userContext = null) {
    const query = {};
    if (club)   query.club   = club;

    // ✅ Permission-based status filtering
    const restrictedStatuses = ['draft', 'pending_coordinator', 'pending_admin'];
    const publicStatuses = ['published', 'ongoing', 'completed', 'archived'];
    
    if (status) {
      if (restrictedStatuses.includes(status)) {
        // Restricted statuses - only visible to authorized users
        if (!userContext) {
          // Not authenticated - can't see restricted events
          query.status = { $in: [] }; // Return no results
        } else {
          const isAdmin = userContext.roles?.global === 'admin';
          
          if (isAdmin) {
            // Admin can see all restricted events
            query.status = status;
          } else {
            // For non-admins, filter by events from their clubs
            const { Club } = require('../club/club.model');
            const { Membership } = require('../club/membership.model');
            
            // Get clubs where user is coordinator or member
            const [coordinatorClubs, memberClubs] = await Promise.all([
              Club.find({ coordinator: userContext.id }).select('_id'),
              Membership.find({ user: userContext.id, status: 'approved' }).select('club')
            ]);
            
            const clubIds = [
              ...coordinatorClubs.map(c => c._id),
              ...memberClubs.map(m => m.club)
            ];
            
            // Only show events from user's clubs with the requested status
            query.status = status;
            query.club = { $in: clubIds };
          }
        }
      } else {
        // Public statuses (published, ongoing, completed) - visible to all
        query.status = status;
      }
    } else {
      // ✅ No status specified - only show public events by default
      query.status = { $in: publicStatuses };
    }

    // ✅ Filter by date for upcoming/past events
    const now = new Date();
    if (upcoming === 'true' || upcoming === true) {
      query.dateTime = { $gte: now }; // Future events only
    } else if (past === 'true' || past === true) {
      query.dateTime = { $lt: now }; // Past events only
    }

    const skip = (page - 1) * limit;
    
    // ✅ Smart sorting based on status/filter
    let sortOrder = { dateTime: -1 }; // Default: newest first
    if (status === 'published' || upcoming) {
      sortOrder = { dateTime: 1 }; // Upcoming: soonest first
    } else if (status === 'completed') {
      sortOrder = { dateTime: -1 }; // Completed: most recent first
    }

    const [total, events] = await Promise.all([
      Event.countDocuments(query),
      Event.find(query)
        .populate('club', 'name logo category') // Populate club details
        .skip(skip)
        .limit(limit)
        .sort(sortOrder)
    ]);
    return { total, page, limit, events };
  }

  /**
   * Get event details with permission flags.
   */
  async getById(id, userContext) {
    const evt = await Event.findById(id).populate('club', 'name logo category coordinator');
    if (!evt) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }
    
    const data = evt.toObject();
    
    // ✅ Add canManage flag (BACKEND is SOURCE OF TRUTH)
    if (userContext && userContext.id) {
      const isAdmin = userContext.roles?.global === 'admin';
      const isCoordinator = userContext.roles?.global === 'coordinator' && 
                           evt.club?.coordinator?.toString() === userContext.id.toString();
      
      // Check club membership
      const { Membership } = require('../club/membership.model');
      const membership = await Membership.findOne({
        user: userContext.id,
        club: evt.club._id,
        status: 'approved'
      });
      
      const coreRoles = ['president', 'core', 'vicePresident', 'secretary', 'treasurer', 'leadPR', 'leadTech'];
      const hasClubRole = membership && coreRoles.includes(membership.role);
      
      data.canManage = isAdmin || isCoordinator || hasClubRole;
    } else {
      data.canManage = false;
    }
    
    return data;
  }

  /**
   * Change event status: submit, approve, publish, start, complete.
   */
  async changeStatus(id, action, userContext) {
    const evt = await Event.findById(id).populate('club', 'name coordinator');
    if (!evt) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    const prevStatus = evt.status;
    if (action === 'submit' && prevStatus === 'draft') {
      // Check if budget requires admin approval
      const requiresAdminApproval = evt.budget > 5000 || 
                                     (evt.guestSpeakers && evt.guestSpeakers.length > 0);
      
      evt.status = 'pending_coordinator';
      evt.requiresAdminApproval = requiresAdminApproval;
      
      await notificationSvc.create({
        user: evt.club.coordinator,
        type: 'approval_required',
        payload: { eventId: id, title: evt.title, budget: evt.budget },
        priority: 'HIGH'
      });

    } else if (action === 'approve' && prevStatus === 'pending_coordinator') {
      // Check if admin approval is required
      const requiresAdminApproval = evt.budget > 5000 || 
                                     (evt.guestSpeakers && evt.guestSpeakers.length > 0);
      
      if (requiresAdminApproval) {
        // Route to admin for approval
        evt.status = 'pending_admin';
        
        // Notify admin
        const { User } = require('../auth/user.model');
        const admins = await User.find({ 'roles.global': 'admin' }).select('_id');
        
        await Promise.all(admins.map(admin =>
          notificationSvc.create({
            user: admin._id,
            type: 'approval_required',
            payload: { 
              eventId: id, 
              title: evt.title, 
              budget: evt.budget,
              reason: evt.budget > 5000 ? 'Budget exceeds ₹5000' : 'External guest speakers'
            },
            priority: 'HIGH'
          })
        ));
      } else {
        // Auto-publish if no admin approval needed
        evt.status = 'approved';
        evt.status = 'published';
        
        // Notify all members
        const members = await Membership.find({ club: evt.club._id, status: 'approved' })
          .distinct('user');
        await Promise.all(members.map(u =>
          notificationSvc.create({
            user: u,
            type: 'event_reminder',
            payload: { eventId: id, dateTime: evt.dateTime },
            priority: 'MEDIUM'
          })
        ));
      }

    } else if (action === 'approve' && prevStatus === 'pending_admin') {
      // ✅ Admin approval for high-budget or special events
      evt.status = 'approved';
      evt.status = 'published';

      // Notify all members
      const members = await Membership.find({ club: evt.club._id, status: 'approved' })
        .distinct('user');
      await Promise.all(members.map(u =>
        notificationSvc.create({
          user: u,
          type: 'event_reminder',
          payload: { eventId: id, dateTime: evt.dateTime },
          priority: 'MEDIUM'
        })
      ));

    } else if (action === 'publish' && prevStatus === 'approved') {
      evt.status = 'published';
      await notificationSvc.create({
        user: evt.coordinator,
        type: 'event_reminder',
        payload: { eventId: id, dateTime: evt.dateTime },
        priority: 'MEDIUM'
      });

    } else if (action === 'start') {
      evt.status = 'ongoing';
      
      // Generate QR code for attendance when event starts
      try {
        const qrData = await generateEventQR(id, evt.title);
        evt.qrCodeUrl = qrData.url;
        evt.attendanceUrl = qrData.attendanceUrl;
      } catch (error) {
        console.error('Failed to generate QR code for event:', error);
        // Don't fail the event start if QR generation fails
      }

    } else if (action === 'complete') {
      evt.status = 'completed';
      // Set report due date to 7 days from completion
      evt.reportDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    } else if (action === 'reject') {
      // ✅ Reject event (Coordinator or Admin can reject)
      // Can reject from pending_coordinator or pending_admin status
      if (!['pending_coordinator', 'pending_admin'].includes(prevStatus)) {
        const err = new Error('Can only reject events pending approval');
        err.statusCode = 400;
        throw err;
      }
      
      evt.status = 'draft'; // Send back to draft
      evt.rejectionReason = statusData.reason;
      evt.rejectedBy = userContext.id;
      evt.rejectedAt = new Date();
      
      // Notify club president about rejection
      const president = await Membership.findOne({
        club: evt.club._id,
        role: 'president',
        status: 'approved'
      });
      
      if (president) {
        await notificationSvc.create({
          user: president.user,
          type: 'event_rejected',
          payload: { 
            eventId: id, 
            title: evt.title,
            reason: statusData.reason
          },
          priority: 'HIGH'
        });
      }

    } else {
      const err = new Error('Invalid action/state');
      err.statusCode = 400;
      throw err;
    }

    await evt.save();

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: `EVENT_${action.toUpperCase()}`,
      target: `Event:${id}`,
      oldValue: { status: prevStatus },
      newValue: { status: evt.status },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return evt;
  }

  /**
   * RSVP for an event.
   */
  async rsvp(eventId, userContext) {
    const evt = await Event.findById(eventId);
    if (!evt || !['approved','published','ongoing'].includes(evt.status)) {
      const err = new Error('Not open for RSVP');
      err.statusCode = 400;
      throw err;
    }

    if (!evt.isPublic) {
      const isMember = await Membership.exists({
        club: evt.club,
        user: userContext.id,
        status: 'approved'
      });
      if (!isMember) {
        const err = new Error('Forbidden');
        err.statusCode = 403;
        throw err;
      }
    }

    await Attendance.findOneAndUpdate(
      { event: eventId, user: userContext.id },
      { status: 'rsvp', timestamp: new Date() },
      { upsert: true }
    );

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'EVENT_RSVP',
      target: `Event:${eventId}`,
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return;
  }

  /**
   * Mark attendance for an event.
   */
  async markAttendance(eventId, { userId }, userContext) {
    await Attendance.findOneAndUpdate(
      { event: eventId, user: userId },
      { status: 'present', timestamp: new Date() },
      { upsert: true }
    );

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'EVENT_MARK_ATTENDANCE',
      target: `Event:${eventId}`,
      newValue: { userId },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return;
  }

  /**
   * Create a budget request.
   */
  async createBudget(eventId, data, userContext) {
    const br = await BudgetRequest.create({ event: eventId, ...data });

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'BUDGET_REQUEST',
      target: `Event:${eventId}`,
      newValue: br.toObject(),
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    // Notify coordinator
    const evt = await Event.findById(eventId);
    await notificationSvc.create({
      user: evt.coordinator,
      type: 'approval_required',
      payload: { budgetRequestId: br._id, amount: br.amount },
      priority: 'HIGH'
    });

    return br;
  }

  /**
   * List budget requests.
   */
  async listBudgets(eventId) {
    return BudgetRequest.find({ event: eventId }).sort({ createdAt: -1 });
  }

  /**
   * Settle a budget.
   */
  async settleBudget(eventId, data, userContext) {
    const br = await BudgetRequest.findOne({ event: eventId, status: 'approved' });
    if (!br) {
      const err = new Error('No approved budget');
      err.statusCode = 400;
      throw err;
    }
    br.status = 'settled';
    br.settledAt = new Date();
    br.summaryUrl = data.reportUrl;
    br.unusedFunds = data.unusedFunds || 0;
    await br.save();

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'BUDGET_SETTLE',
      target: `BudgetRequest:${br._id}`,
      newValue: { status: 'settled' },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    // Notify finance/coordinator
    await notificationSvc.create({
      user: br.eventCoordinatorId, // set from controller
      type: 'system_maintenance', // or new type 'budget_settled'
      payload: { budgetRequestId: br._id },
      priority: 'MEDIUM'
    });

    return br;
  }

  /**
   * Get attendance analytics for an event
   */
  async getAttendanceAnalytics(eventId) {
    const event = await Event.findById(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    const [
      totalRSVPs,
      totalAttendance,
      attendanceByHour,
      attendanceStats
    ] = await Promise.all([
      Attendance.countDocuments({ event: eventId, status: 'rsvp' }),
      Attendance.countDocuments({ event: eventId, status: 'present' }),
      
      // Attendance by hour (for ongoing/completed events)
      Attendance.aggregate([
        { $match: { event: mongoose.Types.ObjectId(eventId), status: 'present' } },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // General attendance statistics
      Attendance.aggregate([
        { $match: { event: mongoose.Types.ObjectId(eventId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const attendanceRate = totalRSVPs > 0 ? (totalAttendance / totalRSVPs) * 100 : 0;

    return {
      totalRSVPs,
      totalAttendance,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      attendanceByHour,
      statusBreakdown: attendanceStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      eventCapacity: event.capacity,
      capacityUtilization: event.capacity > 0 ? (totalAttendance / event.capacity) * 100 : null
    };
  }

  /**
   * Get event analytics dashboard
   */
  async getEventAnalytics(eventId, period = 'month') {
    const event = await Event.findById(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    const attendanceAnalytics = await this.getAttendanceAnalytics(eventId);
    
    return {
      event: {
        id: event._id,
        title: event.title,
        dateTime: event.dateTime,
        status: event.status,
        venue: event.venue,
        capacity: event.capacity
      },
      attendance: attendanceAnalytics,
      summary: {
        totalBudget: event.budget,
        expectedAttendees: event.expectedAttendees,
        actualAttendees: attendanceAnalytics.totalAttendance,
        attendanceAccuracy: event.expectedAttendees > 0 
          ? (attendanceAnalytics.totalAttendance / event.expectedAttendees) * 100 
          : null
      }
    };
  }

  /**
   * Generate attendance report
   */
  async generateAttendanceReport(eventId, format = 'json') {
    const event = await Event.findById(eventId);
    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    const attendees = await Attendance.find({ event: eventId })
      .populate('user', 'profile.name rollNumber email')
      .sort({ timestamp: -1 });

    const analytics = await this.getAttendanceAnalytics(eventId);

    const report = {
      event: {
        id: event._id,
        title: event.title,
        dateTime: event.dateTime,
        venue: event.venue,
        status: event.status
      },
      summary: analytics,
      attendees: attendees.map(att => ({
        name: att.user.profile.name,
        rollNumber: att.user.rollNumber,
        email: att.user.email,
        status: att.status,
        timestamp: att.timestamp
      })),
      generatedAt: new Date(),
      format
    };

    return report;
  }

  /**
   * Coordinator Financial Override
   * Allows coordinator to reject/reduce event budget with reason
   */
  async coordinatorOverrideBudget(eventId, overrideData, userContext) {
    const evt = await Event.findById(eventId).populate('club', 'name coordinator');
    if (!evt) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    const { action, reason, adjustedBudget } = overrideData;
    
    // Validate action
    if (!['budget_rejection', 'budget_reduction', 'event_cancellation'].includes(action)) {
      const err = new Error('Invalid override action');
      err.statusCode = 400;
      throw err;
    }

    // Store original budget
    const originalBudget = evt.budget;

    // Apply override
    evt.coordinatorOverride = {
      overridden: true,
      type: action,
      reason: reason,
      originalBudget: originalBudget,
      adjustedBudget: action === 'budget_reduction' ? adjustedBudget : 0,
      overriddenBy: userContext.id,
      overriddenAt: new Date()
    };

    // Update event based on action
    if (action === 'budget_rejection') {
      evt.budget = 0;
      evt.status = 'archived'; // Reject the event
    } else if (action === 'budget_reduction') {
      if (!adjustedBudget || adjustedBudget >= originalBudget) {
        const err = new Error('Adjusted budget must be less than original');
        err.statusCode = 400;
        throw err;
      }
      evt.budget = adjustedBudget;
    } else if (action === 'event_cancellation') {
      evt.status = 'archived';
      evt.budget = 0;
    }

    await evt.save();

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'COORDINATOR_FINANCIAL_OVERRIDE',
      target: `Event:${eventId}`,
      oldValue: { budget: originalBudget, status: evt.status },
      newValue: { 
        budget: evt.budget, 
        status: evt.status,
        override: evt.coordinatorOverride 
      },
      ip: userContext.ip,
      userAgent: userContext.userAgent,
      severity: 'HIGH' // High severity for override actions
    });

    // Get club president for notification
    const president = await Membership.findOne({ 
      club: evt.club._id, 
      role: 'president',
      status: 'approved' 
    }).select('user');

    if (president) {
      await notificationSvc.create({
        user: president.user,
        type: 'coordinator_override',
        payload: { 
          eventId: evt._id,
          eventTitle: evt.title,
          action: action,
          reason: reason,
          originalBudget: originalBudget,
          adjustedBudget: evt.budget,
          coordinatorName: userContext.name || 'Coordinator'
        },
        priority: 'HIGH'
      });
    }

    return evt;
  }
}

module.exports = new EventService();