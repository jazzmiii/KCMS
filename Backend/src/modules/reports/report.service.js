const mongoose = require('mongoose');
const { Club } = require('../club/club.model');
const { Membership } = require('../club/membership.model');
const { Event } = require('../event/event.model');
const { Recruitment } = require('../recruitment/recruitment.model');
const { BudgetRequest } = require('../event/budgetRequest.model');
const { AuditLog } = require('../audit/auditLog.model');
const { Attendance } = require('../event/attendance.model');
const reportGenerator = require('../../utils/reportGenerator');

class ReportService {
  async dashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const clubsCount = await Club.countDocuments({ status: 'active' });
    const membersCount = await Membership.countDocuments({ status: 'approved' });
    const eventsThisMonth = await Event.countDocuments({
      dateTime: { $gte: monthStart, $lt: now }
    });
    const pendingClubs = await Club.countDocuments({ status: 'pending_approval' });
    const pendingEvents = await Event.countDocuments({ status: 'pending_coordinator' });
    const recruitmentStatuses = await Recruitment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const recruitmentSummary = {};
    recruitmentStatuses.forEach(r => recruitmentSummary[r._id] = r.count);

    return {
      clubsCount,
      membersCount,
      eventsThisMonth,
      pendingClubs,
      pendingEvents,
      recruitmentSummary
    };
  }

  async clubActivity({ clubId, year }) {
    const start = new Date(year, 0, 1), end = new Date(year+1, 0, 1);
    const eventsCount = await Event.countDocuments({
      club: clubId,
      dateTime: { $gte: start, $lt: end }
    });
    const membersCount = await Membership.countDocuments({
      club: clubId,
      status: 'approved'
    });
    const budgets = await BudgetRequest.aggregate([
      { $match: { event: { $in: await Event.find({ club: clubId }).distinct('_id') } } },
      { $group: { _id: null, totalRequested: { $sum: '$amount' } } }
    ]);
    const recs = await Recruitment.countDocuments({ club: clubId, startDate: { $gte: start, $lt: end } });
    const apps = await mongoose.model('Application').countDocuments({
      recruitment: { $in: await Recruitment.find({ club: clubId }).distinct('_id') }
    });

    return {
      eventsCount,
      membersCount,
      totalBudgetRequested: budgets[0]?.totalRequested || 0,
      recruitmentCycles: recs,
      applications: apps
    };
  }

  async naacNba({ year }) {
    // similar to dashboard + clubActivity for all clubs
    const dash = await this.dashboard();
    const annual = await this.annual({ year });
    // attach evidence: count of docs & media uploaded that year
    const docsCount = await mongoose.model('Document').countDocuments({
      createdAt: { $gte: new Date(year,0,1), $lt: new Date(year+1,0,1) }
    });
    return { dash, annual, docsCount };
  }

  async annual({ year }) {
    const start = new Date(year,0,1), end = new Date(year+1,0,1);
    const clubs = await Club.countDocuments({ createdAt: { $gte: start, $lt: end } });
    const events = await Event.countDocuments({ createdAt: { $gte: start, $lt: end } });
    const members = await Membership.countDocuments({ createdAt: { $gte: start, $lt: end } });
    return { clubs, events, members };
  }

  async listAudit({ user, action, from, to, page=1, limit=20 }) {
    const query = {};
    if (user)   query.user = user;
    if (action) query.action = action;
    if (from || to) query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to)   query.createdAt.$lte = new Date(to);

    const skip = (page-1)*limit;
    const [total, items] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);
    return { total, page, limit, items };
  }

  /**
   * Generate Club Activity Report (PDF)
   */
  async generateClubActivityReport(clubId, year, userContext) {
    const club = await Club.findById(clubId).populate('coordinator', 'profile.name');
    if (!club) {
      const err = new Error('Club not found');
      err.statusCode = 404;
      throw err;
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [events, members, budgetRequests] = await Promise.all([
      Event.find({ 
        club: clubId, 
        dateTime: { $gte: startDate, $lt: endDate } 
      }).populate('club', 'name'),
      
      Membership.find({ 
        club: clubId, 
        status: 'approved' 
      }).populate('user', 'profile.name rollNumber'),
      
      BudgetRequest.find({
        event: { $in: await Event.find({ club: clubId }).distinct('_id') },
        createdAt: { $gte: startDate, $lt: endDate }
      }).populate('event', 'title')
    ]);

    const clubData = {
      name: club.name,
      category: club.category,
      status: club.status,
      coordinatorName: club.coordinator?.profile?.name || 'N/A'
    };

    const eventData = events.map(event => ({
      title: event.title,
      dateTime: event.dateTime,
      status: event.status,
      attendees: event.expectedAttendees || 0
    }));

    const memberData = {
      totalMembers: members.length
    };

    const budgetData = budgetRequests.map(br => ({
      title: br.event?.title || 'Unknown Event',
      amount: br.amount,
      status: br.status
    }));

    const fileName = `club-activity-${club.name}-${year}.pdf`;
    return await reportGenerator.generateAndUploadReport(
      'club-activity',
      { clubData, eventData, memberData, budgetData },
      fileName,
      { folder: `reports/${year}/clubs` }
    );
  }

  /**
   * Generate NAAC/NBA Report (Excel)
   */
  async generateNAACReport(year, userContext) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [clubs, events, members] = await Promise.all([
      Club.find({ status: 'active' }),
      Event.find({ 
        dateTime: { $gte: startDate, $lt: endDate } 
      }).populate('club', 'name'),
      Membership.find({ 
        status: 'approved',
        createdAt: { $gte: startDate, $lt: endDate }
      })
    ]);

    const clubsData = await Promise.all(clubs.map(async club => {
      const memberCount = await Membership.countDocuments({ 
        club: club._id, 
        status: 'approved' 
      });
      return {
        _id: club._id,
        name: club.name,
        category: club.category,
        status: club.status,
        memberCount
      };
    }));

    const eventsData = events.map(event => ({
      clubId: event.club._id,
      title: event.title,
      dateTime: event.dateTime,
      attendees: event.expectedAttendees || 0,
      budget: event.budget || 0
    }));

    const membersData = members.map(member => ({
      clubId: member.club,
      userId: member.user,
      role: member.role
    }));

    const fileName = `naac-report-${year}.xlsx`;
    return await reportGenerator.generateAndUploadReport(
      'naac',
      { clubsData, eventsData, membersData },
      fileName,
      { folder: `reports/${year}` }
    );
  }

  /**
   * Generate Annual Report (PDF)
   */
  async generateAnnualReport(year, userContext) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [
      clubsCount,
      eventsCount,
      membersCount,
      totalBudget,
      clubs,
      events
    ] = await Promise.all([
      Club.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
      Event.countDocuments({ dateTime: { $gte: startDate, $lt: endDate } }),
      Membership.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
      Event.aggregate([
        { $match: { dateTime: { $gte: startDate, $lt: endDate } } },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ]),
      Club.find({ status: 'active' }).limit(10),
      Event.find({ 
        dateTime: { $gte: startDate, $lt: endDate },
        status: 'completed'
      }).populate('club', 'name').sort({ expectedAttendees: -1 }).limit(10)
    ]);

    const summaryData = {
      totalClubs: clubsCount,
      totalEvents: eventsCount,
      totalMembers: membersCount,
      totalBudget: totalBudget[0]?.total || 0
    };

    const topClubs = await Promise.all(clubs.map(async club => {
      const [eventsCount, memberCount] = await Promise.all([
        Event.countDocuments({ 
          club: club._id, 
          dateTime: { $gte: startDate, $lt: endDate } 
        }),
        Membership.countDocuments({ 
          club: club._id, 
          status: 'approved' 
        })
      ]);
      return {
        name: club.name,
        eventsCount,
        memberCount
      };
    }));

    const topEvents = events.map(event => ({
      title: event.title,
      clubName: event.club.name,
      dateTime: event.dateTime,
      attendees: event.expectedAttendees || 0
    }));

    const fileName = `annual-report-${year}.pdf`;
    return await reportGenerator.generateAndUploadReport(
      'annual',
      { year, summaryData, topClubs, topEvents },
      fileName,
      { folder: `reports/${year}` }
    );
  }

  /**
   * Generate Attendance Report (Excel)
   */
  async generateAttendanceReport(eventId, userContext) {
    const event = await Event.findById(eventId).populate('club', 'name');
    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    const attendance = await Attendance.find({ event: eventId })
      .populate('user', 'profile.name rollNumber email')
      .sort({ timestamp: -1 });

    const attendanceData = attendance.map(att => ({
      rollNumber: att.user.rollNumber,
      name: att.user.profile.name,
      email: att.user.email,
      status: att.status,
      timestamp: att.timestamp
    }));

    const eventInfo = {
      title: event.title,
      dateTime: event.dateTime,
      venue: event.venue,
      clubName: event.club.name
    };

    const fileName = `attendance-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}-${eventId}.xlsx`;
    return await reportGenerator.generateAndUploadReport(
      'attendance',
      { attendanceData, eventInfo },
      fileName,
      { folder: `reports/attendance/${new Date().getFullYear()}` }
    );
  }
}

module.exports = new ReportService();