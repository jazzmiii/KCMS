//src/modules/recruitment/recruitment.service.js
const mongoose             = require('mongoose');
const { Recruitment }      = require('./recruitment.model');
const { Application }      = require('./application.model');
const { Membership }       = require('../club/membership.model');
const auditService         = require('../audit/audit.service');
const notificationService  = require('../notification/notification.service');
const recruitmentQueue = require('../../queues/recruitment.queue');

class RecruitmentService {
  async create(data, userContext) {
    const rec = await Recruitment.create(data);

    await auditService.log({
      user: userContext.id,
      action: 'RECRUITMENT_CREATE',
      target: `Recruitment:${rec._id}`,
      newValue: rec.toObject(),
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return rec;
  }

  async update(id, data, userContext) {
    const rec = await Recruitment.findByIdAndUpdate(id, data, { new: true });
    if (!rec) throw Object.assign(new Error('Not found'), { statusCode: 404 });

    await auditService.log({
      user: userContext.id,
      action: 'RECRUITMENT_UPDATE',
      target: `Recruitment:${id}`,
      oldValue: null,
      newValue: data,
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return rec;
  }

  async changeStatus(id, action, userContext) {
    const rec = await Recruitment.findById(id);
    if (!rec) throw Object.assign(new Error('Not found'), { statusCode: 404 });
    const prevStatus = rec.status;

    if (action === 'schedule' && prevStatus === 'draft') {
      rec.status = 'scheduled';
      await notificationService.create({
        user: rec.coordinator,
        type: 'approval_required',
        payload: { recruitmentId: id, title: rec.title },
        priority: 'HIGH'
      });

    } else if (action === 'open' && prevStatus === 'scheduled') {
      rec.status = 'open';
      const users = await mongoose.model('User')
        .find({ status: 'profile_complete' })
        .select('_id');
      await Promise.all(users.map(u =>
        notificationService.create({
          user: u._id,
          type: 'recruitment_open',
          payload: { recruitmentId: id, title: rec.title },
          priority: 'MEDIUM'
        })
      ));

    } else if (action === 'closeSoon' && prevStatus === 'open') {
      rec.status = 'closing_soon';
      // Send 24-hour warning to all applicants and potential applicants
      const apps = await Application.find({ recruitment: id }).distinct('user');
      const allUsers = await mongoose.model('User')
        .find({ status: 'profile_complete', _id: { $nin: apps } })
        .select('_id');
      
      const notifyUsers = [...apps, ...allUsers.map(u => u._id)];
      await Promise.all(notifyUsers.map(userId =>
        notificationService.create({
          user: userId,
          type: 'recruitment_closing',
          payload: { recruitmentId: id, title: rec.title, hoursLeft: 24 },
          priority: 'HIGH'
        })
      ));

    } else if (action === 'close' && (prevStatus === 'open' || prevStatus === 'closing_soon')) {
      rec.status = 'closed';
      const apps = await Application.find({ recruitment: id });
      await Promise.all(apps.map(a =>
        notificationService.create({
          user: a.user,
          type: 'application_status',
          payload: { applicationId: a._id, recruitmentClosed: true },
          priority: 'MEDIUM'
        })
      ));

    } else {
      throw Object.assign(new Error('Invalid action/state'), { statusCode: 400 });
    }

    await rec.save();
    await auditService.log({
      user: userContext.id,
      action: `RECRUITMENT_${action.toUpperCase()}`,
      target: `Recruitment:${id}`,
      oldValue: { status: prevStatus },
      newValue: { status: rec.status },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });
    return rec;
  }

  async list(filters) {
    const { club, status, page = 1, limit = 20 } = filters;
    const query = {};
    if (club)   query.club   = club;
    if (status) query.status = status;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      Recruitment.countDocuments(query),
      Recruitment.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
    ]);
    return { total, page, limit, items };
  }

  async getById(id) {
    const rec = await Recruitment.findById(id);
    if (!rec) throw Object.assign(new Error('Not found'), { statusCode: 404 });
    return rec;
  }

  async apply(id, userId, answers, userContext) {
    const rec = await Recruitment.findById(id);
    if (!rec || rec.status !== 'open') {
      throw Object.assign(new Error('Not open for applications'), { statusCode: 400 });
    }
    if (await Application.exists({ recruitment: id, user: userId })) {
      throw Object.assign(new Error('Already applied'), { statusCode: 400 });
    }

    // ✅ Check if student already has 3 approved club memberships
    const approvedMembershipsCount = await Membership.countDocuments({
      user: userId,
      status: 'approved'
    });

    if (approvedMembershipsCount >= 3) {
      throw Object.assign(
        new Error('You are already a member of 3 clubs. Maximum club limit reached.'),
        { statusCode: 400 }
      );
    }

    const app = await Application.create({ recruitment: id, user: userId, answers });

    await auditService.log({
      user: userContext.id,
      action: 'APPLICATION_SUBMIT',
      target: `Application:${app._id}`,
      newValue: app.toObject(),
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    const cores = await Membership.find({ club: rec.club, status: 'approved' }).distinct('user');
    await Promise.all(cores.map(uid =>
      notificationService.create({
        user: uid,
        type: 'application_status',
        payload: { applicationId: app._id, status: 'submitted' },
        priority: 'HIGH'
      })
    ));

    return app;
  }

  async listApplications(recId, filters) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      Application.countDocuments({ recruitment: recId }),
      Application.find({ recruitment: recId })
        .skip(skip)
        .limit(limit)
        .sort({ appliedAt: -1 })
        .populate('user','profile.name email')
    ]);
    return { total, page, limit, items };
  }

  async reviewApplication(appId, data, userContext) {
    const app = await Application.findById(appId);
    if (!app) throw Object.assign(new Error('Not found'), { statusCode: 404 });
    const prevStatus = app.status;

    app.status = data.status;
    if (data.score != null) app.score = data.score;
    await app.save();

    await auditService.log({
      user: userContext.id,
      action: 'APPLICATION_REVIEW',
      target: `Application:${appId}`,
      oldValue: { status: prevStatus },
      newValue: { status: data.status },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    if (data.status === 'selected') {
      await Membership.create({
        club: app.recruitment,
        user: app.user,
        role: 'member',
        status: 'approved'
      });
    }

    await notificationService.create({
      user: app.user,
      type: 'application_status',
      payload: { applicationId: app._id, status: data.status },
      priority: 'MEDIUM'
    });

    return app;
  }

  async bulkReview(recId, applicationIds, status, userContext) {
    await Application.updateMany(
      { _id: { $in: applicationIds }, recruitment: recId },
      { status }
    );

    await auditService.log({
      user: userContext.id,
      action: 'APPLICATION_BULK_REVIEW',
      target: `Recruitment:${recId}`,
      newValue: { applicationIds, status },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return { updatedCount: applicationIds.length };
  }
}

module.exports = new RecruitmentService();