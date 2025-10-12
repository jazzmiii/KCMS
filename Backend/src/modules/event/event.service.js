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

    // Notify coordinator for approval
    await notificationSvc.create({
      user: evt.coordinator,
      type: 'approval_required',
      payload: { eventId: evt._id, title: evt.title },
      priority: 'HIGH'
    });

    return evt;
  }

  /**
   * List events with pagination and filters.
   */
  async list({ club, status, page = 1, limit = 20 }) {
    const query = {};
    if (club)   query.club   = club;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [total, events] = await Promise.all([
      Event.countDocuments(query),
      Event.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ dateTime: -1 })
    ]);
    return { total, page, limit, events };
  }

  /**
   * Get event details.
   */
  async getById(id) {
    const evt = await Event.findById(id);
    if (!evt) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }
    return evt;
  }

  /**
   * Change event status: submit, approve, publish, start, complete.
   */
  async changeStatus(id, action, userContext) {
    const evt = await Event.findById(id);
    if (!evt) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    const prevStatus = evt.status;
    if (action === 'submit' && prevStatus === 'draft') {
      evt.status = 'pending_coordinator';
      await notificationSvc.create({
        user: evt.coordinator,
        type: 'approval_required',
        payload: { eventId: id, title: evt.title },
        priority: 'HIGH'
      });

    } else if (action === 'approve' && prevStatus === 'pending_coordinator') {
      // Auto-publish if no further admin needed
      evt.status = 'approved';
      evt.status = 'published';

      // Notify all members
      const members = await Membership.find({ club: evt.club, status: 'approved' })
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
}

module.exports = new EventService();