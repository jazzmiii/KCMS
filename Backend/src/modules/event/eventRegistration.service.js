// src/modules/event/eventRegistration.service.js
const mongoose = require('mongoose');
const { EventRegistration } = require('./eventRegistration.model');
const { Event } = require('./event.model');
const { Membership } = require('../club/membership.model');
const { User } = require('../auth/user.model');
const { Attendance } = require('./attendance.model');
const notificationService = require('../notification/notification.service');
const auditService = require('../audit/audit.service');

class EventRegistrationService {
  /**
   * Register for an event (as performer or audience)
   */
  async register(eventId, data, userContext) {
    // Verify event exists and is published
    const event = await Event.findById(eventId).populate('participatingClubs');
    if (!event || event.status !== 'published') {
      const err = new Error('Event not found or not published');
      err.statusCode = 404;
      throw err;
    }

    // Check if already registered
    const existing = await EventRegistration.findOne({ 
      event: eventId, 
      user: userContext.id 
    });
    if (existing) {
      const err = new Error('Already registered for this event');
      err.statusCode = 400;
      throw err;
    }

    // Validate performer registration
    if (data.registrationType === 'performer') {
      if (!event.allowPerformerRegistrations) {
        const err = new Error('Performer registrations not allowed for this event');
        err.statusCode = 400;
        throw err;
      }

      if (!data.club) {
        const err = new Error('Club is required for performer registration');
        err.statusCode = 400;
        throw err;
      }

      // Verify club is participating in event
      if (!event.participatingClubs.some(c => c._id.toString() === data.club)) {
        const err = new Error('Selected club is not participating in this event');
        err.statusCode = 400;
        throw err;
      }

      // Verify user is member of the club
      const membership = await Membership.findOne({
        club: data.club,
        user: userContext.id,
        status: 'approved'
      });
      if (!membership) {
        const err = new Error('You are not a member of the selected club');
        err.statusCode = 403;
        throw err;
      }
    }

    // Create registration
    const registration = new EventRegistration({
      event: eventId,
      user: userContext.id,
      registrationType: data.registrationType || 'audience',
      club: data.club,
      performanceType: data.performanceType,
      performanceDescription: data.performanceDescription,
      notes: data.notes,
      status: data.registrationType === 'performer' ? 'pending' : 'approved'
    });

    await registration.save();

    // If audience, auto-approve and create attendance
    if (registration.registrationType === 'audience') {
      await Attendance.create({
        event: eventId,
        user: userContext.id,
        status: 'rsvp',
        type: 'audience',
        timestamp: new Date()
      });
    } else {
      // Notify club presidents about performer registration
      const clubMembers = await Membership.find({
        club: data.club,
        role: { $in: ['president', 'vicePresident'] },
        status: 'approved'
      }).distinct('user');

      await Promise.all(clubMembers.map(userId =>
        notificationService.create({
          user: userId,
          type: 'performer_registration',
          payload: {
            eventId,
            eventTitle: event.title,
            userId: userContext.id,
            performanceType: data.performanceType,
            registrationId: registration._id
          },
          priority: 'MEDIUM'
        })
      ));
    }

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'EVENT_REGISTER',
      target: `Event:${eventId}`,
      newValue: { type: registration.registrationType, club: data.club },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return registration.populate('club user');
  }

  /**
   * Approve/reject performer registration (club president)
   */
  async reviewRegistration(registrationId, decision, userContext) {
    const registration = await EventRegistration.findById(registrationId)
      .populate('event club user');

    if (!registration) {
      const err = new Error('Registration not found');
      err.statusCode = 404;
      throw err;
    }

    if (registration.registrationType !== 'performer') {
      const err = new Error('Only performer registrations need approval');
      err.statusCode = 400;
      throw err;
    }

    if (registration.status !== 'pending') {
      const err = new Error('Registration already reviewed');
      err.statusCode = 400;
      throw err;
    }

    // Check if user has permission (club president/vicePresident or admin)
    const user = await User.findById(userContext.id);
    const isAdmin = user.roles?.global === 'admin';
    
    const membership = await Membership.findOne({
      club: registration.club._id,
      user: userContext.id,
      role: { $in: ['president', 'vicePresident'] },
      status: 'approved'
    });

    if (!isAdmin && !membership) {
      const err = new Error('Forbidden: Only club leaders can review registrations');
      err.statusCode = 403;
      throw err;
    }

    // Update registration
    registration.status = decision.status; // 'approved' or 'rejected'
    registration.approvedBy = userContext.id;
    registration.approvedAt = new Date();
    if (decision.rejectionReason) {
      registration.rejectionReason = decision.rejectionReason;
    }

    await registration.save();

    // If approved, create performer attendance
    if (decision.status === 'approved') {
      await Attendance.create({
        event: registration.event._id,
        user: registration.user._id,
        status: 'rsvp',
        type: 'performer',
        club: registration.club._id,
        timestamp: new Date()
      });
    }

    // Notify student
    const notifType = decision.status === 'approved' 
      ? 'performer_approved' 
      : 'performer_rejected';
    
    await notificationService.create({
      user: registration.user._id,
      type: notifType,
      payload: {
        eventId: registration.event._id,
        eventTitle: registration.event.title,
        club: registration.club.name,
        performanceType: registration.performanceType,
        rejectionReason: decision.rejectionReason
      },
      priority: decision.status === 'approved' ? 'HIGH' : 'MEDIUM'
    });

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: `PERFORMER_${decision.status.toUpperCase()}`,
      target: `EventRegistration:${registrationId}`,
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return registration;
  }

  /**
   * List registrations for an event
   */
  async listEventRegistrations(eventId, filters = {}) {
    const query = { event: eventId };
    
    if (filters.registrationType) {
      query.registrationType = filters.registrationType;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.club) {
      query.club = filters.club;
    }

    const registrations = await EventRegistration.find(query)
      .populate('user club approvedBy')
      .sort({ createdAt: -1 });

    return registrations;
  }

  /**
   * Get my registration for an event
   */
  async getMyRegistration(eventId, userId) {
    const registration = await EventRegistration.findOne({ 
      event: eventId, 
      user: userId 
    }).populate('club approvedBy');

    return registration;
  }

  /**
   * Get pending performer registrations for a club
   */
  async listClubPendingRegistrations(clubId, eventId = null) {
    const query = {
      club: clubId,
      registrationType: 'performer',
      status: 'pending'
    };

    if (eventId) {
      query.event = eventId;
    }

    const registrations = await EventRegistration.find(query)
      .populate('event user')
      .sort({ createdAt: -1 });

    return registrations;
  }

  /**
   * Get registration statistics for an event
   */
  async getEventStats(eventId) {
    const stats = await EventRegistration.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: {
            type: '$registrationType',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      audience: 0,
      performers: {
        pending: 0,
        approved: 0,
        rejected: 0
      },
      total: 0
    };

    stats.forEach(s => {
      if (s._id.type === 'audience') {
        result.audience = s.count;
      } else if (s._id.type === 'performer') {
        result.performers[s._id.status] = s.count;
      }
      result.total += s.count;
    });

    return result;
  }

  /**
   * Cancel registration
   */
  async cancelRegistration(registrationId, userContext) {
    const registration = await EventRegistration.findById(registrationId);

    if (!registration) {
      const err = new Error('Registration not found');
      err.statusCode = 404;
      throw err;
    }

    if (registration.user.toString() !== userContext.id) {
      const err = new Error('Forbidden: Can only cancel your own registration');
      err.statusCode = 403;
      throw err;
    }

    // Remove attendance if exists
    await Attendance.deleteOne({
      event: registration.event,
      user: registration.user
    });

    await registration.deleteOne();

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'EVENT_REGISTRATION_CANCELLED',
      target: `Event:${registration.event}`,
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return { message: 'Registration cancelled successfully' };
  }
}

module.exports = new EventRegistrationService();
