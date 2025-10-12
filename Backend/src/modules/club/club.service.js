// src/modules/club/club.service.js
const { Club }       = require('./club.model');
const { Membership } = require('./membership.model');
const cloudinary     = require('../../utils/cloudinary');
const redis          = require('../../config/redis');
const mongoose       = require('mongoose');
const auditService        = require('../audit/audit.service');
const notificationService = require('../notification/notification.service');

const CLUB_LIST_CACHE = 'clubs:list';

class ClubService {
  // Clear cached club listings
  async flushCache() {
    const keys = await redis.keys(`${CLUB_LIST_CACHE}:*`);
    if (keys.length) await redis.del(...keys);
  }

  // Create a new club
  async createClub(data, logoFile, userContext) {
    if (await Club.findOne({ name: data.name })) {
      const err = new Error('Club name already exists');
      err.statusCode = 409;
      throw err;
    }

    // Upload logo if provided
    let logoUrl = '';
    if (logoFile) {
      const res = await cloudinary.uploader.upload(logoFile.path, {
        folder: `clubs/${data.name}/logo`,
        width: 500, height: 500, crop: 'limit'
      });
      logoUrl = res.secure_url;
    }

    // Create club document
    const club = await Club.create({ ...data, logoUrl, status: 'draft' });

    // Add core members
    if (Array.isArray(data.coreMembers)) {
      await Promise.all(data.coreMembers.map(userId =>
        Membership.create({
          club: club._id,
          user: userId,
          role: 'core',
          status: 'approved'
        })
      ));
    }
    // Ensure coordinator is president
    await Membership.findOneAndUpdate(
      { club: club._id, user: data.coordinator },
      { role: 'president', status: 'approved' },
      { upsert: true }
    );

    // Notify coordinator for approval
    await notificationService.create({
      user: data.coordinator,
      type: 'approval_required',
      payload: { clubId: club._id, name: club.name },
      priority: 'HIGH'
    });

    // Audit the creation
    await auditService.log({
      user: userContext.id,
      action: 'CLUB_CREATE',
      target: `Club:${club._id}`,
      newValue: club.toObject(),
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    await this.flushCache();
    return club;
  }

  // List active clubs (with Redis caching)
  async listClubs({ category, search, page = 1, limit = 20 }) {
    const key = `${CLUB_LIST_CACHE}:${category||'all'}:${search||''}:${page}:${limit}`;
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const query = { status: 'active' };
    if (category) query.category = category;
    if (search) query.name = new RegExp(search, 'i');

    const skip = (page - 1) * limit;
    const [total, clubs] = await Promise.all([
      Club.countDocuments(query),
      Club.find(query).skip(skip).limit(limit).sort({ createdAt: -1 })
    ]);

    const result = { total, page, limit, clubs };
    await redis.set(key, JSON.stringify(result), 'EX', 300);
    return result;
  }

  // Get club details, include members if scoped
  async getClub(clubId, userContext) {
    const club = await Club.findById(clubId);
    if (!club || club.status !== 'active') {
      const err = new Error('Club not found');
      err.statusCode = 404;
      throw err;
    }
    const data = club.toObject();

    // If user is a member, include full member list
    if (userContext) {
      const isMember = await Membership.exists({
        club: clubId,
        user: userContext.id,
        status: 'approved'
      });
      if (isMember) {
        data.members = await Membership.find({ club: clubId, status: 'approved' })
          .populate('user', 'profile.name');
      }
    }
    return data;
  }

  /**
   * Update club settings.
   * Public fields apply immediately.
   * Protected (name, category, coreMembers) require approval.
   */
  async updateSettings(clubId, updates, userContext) {
    const club = await Club.findById(clubId);
    if (!club) throw Object.assign(new Error('Club not found'), { statusCode: 404 });

    // Separate fields
    const publicFields    = ['description','vision','mission','socialLinks','bannerUrl'];
    const protectedFields = ['name','category','coreMembers'];

    const pub = {};
    const prot = {};

    // Split updates
    for (const key of Object.keys(updates)) {
      if (publicFields.includes(key)) pub[key] = updates[key];
      else if (protectedFields.includes(key)) prot[key] = updates[key];
    }

    // Apply public immediately
    if (Object.keys(pub).length) {
      Object.assign(club, pub);

      // Audit public update
      await auditService.log({
        user: userContext.id,
        action: 'CLUB_PUBLIC_UPDATE',
        target: `Club:${clubId}`,
        newValue: pub,
        ip: userContext.ip,
        userAgent: userContext.userAgent
      });
    }

    // Store protected under pendingSettings
    if (Object.keys(prot).length) {
      club.pendingSettings = { ...club.pendingSettings, ...prot };
      club.status = 'pending_approval';

      // Notify coordinator for approval
      await notificationService.create({
        user: club.coordinator,
        type: 'approval_required',
        payload: { clubId, pending: Object.keys(prot) },
        priority: 'HIGH'
      });

      // Audit protected request
      await auditService.log({
        user: userContext.id,
        action: 'CLUB_PROTECTED_UPDATE_REQUEST',
        target: `Club:${clubId}`,
        newValue: prot,
        ip: userContext.ip,
        userAgent: userContext.userAgent
      });
    }

    await club.save();
    await this.flushCache();
    return club;
  }

  
  /**
   * Coordinator/Admin approves pendingSettings.
   */
  async approveSettings(clubId, userContext) {
    const club = await Club.findById(clubId);
    if (!club) throw Object.assign(new Error('Club not found'), { statusCode: 404 });
    if (!club.pendingSettings) {
      throw Object.assign(new Error('No pending changes'), { statusCode: 400 });
    }

    const old = {};
    for (const k of Object.keys(club.pendingSettings)) {
      old[k] = club[k];
      club[k] = club.pendingSettings[k];
    }
    club.pendingSettings = undefined;
    club.status = 'active';
    await club.save();

    // Notify president & members
    const members = await Membership.find({ club: clubId, status: 'approved' }).distinct('user');
    await notificationService.create({
      user: club.coordinator,
      type: 'approval_required', // or define 'settings_approved'
      payload: { clubId, approved: true },
      priority: 'MEDIUM'
    });

    // Audit approval
    await auditService.log({
      user: userContext.id,
      action: 'CLUB_PROTECTED_UPDATE_APPROVE',
      target: `Club:${clubId}`,
      oldValue: old,
      newValue: club.toObject(),
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    await this.flushCache();
    return club;
  }

  // Submit or approve club for activation
  async approveClub(clubId, action, userContext) {
    const club = await Club.findById(clubId);
    if (!club) throw Object.assign(new Error('Not found'), { statusCode: 404 });
    const prevStatus = club.status;

    if (action === 'submit' && club.status === 'draft') {
      club.status = 'pending_approval';
      await notificationService.create({
        user: club.coordinator,
        type: 'approval_required',
        payload: { clubId, name: club.name },
        priority: 'HIGH'
      });
    }
    else if (action === 'approve' && club.status === 'pending_approval') {
      club.status = 'active';
      // Notify president & members
      const members = await Membership.find({ club: clubId, status: 'approved' })
        .distinct('user');
      await Promise.all(members.map(u =>
        notificationService.create({
          user: u,
          type: 'role_assigned',          // or 'club_activated'
          payload: { clubId },
          priority: 'MEDIUM'
        })
      ));
    }
    else {
      throw Object.assign(new Error('Invalid action or state'), { statusCode: 400 });
    }

    await club.save();
    await auditService.log({
      user: userContext.id,
      action: `CLUB_${action.toUpperCase()}`,
      target: `Club:${clubId}`,
      oldValue: { status: prevStatus },
      newValue: { status: club.status },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });
    await this.flushCache();
    return club;
  }

  // Archive (soft-delete) a club
  async archiveClub(clubId, userContext) {
    const club = await Club.findById(clubId);
    if (!club) throw Object.assign(new Error('Club not found'), { statusCode: 404 });
    const prevStatus = club.status;
    club.status = 'archived';
    await club.save();

    // Notify core team
    await notificationService.create({
      user: userContext.id,
      type: 'system_maintenance',   // or 'club_archived'
      payload: { clubId },
      priority: 'HIGH'
    });

    await auditService.log({
      user: userContext.id,
      action: 'CLUB_ARCHIVE',
      target: `Club:${clubId}`,
      oldValue: { status: prevStatus },
      newValue: { status: 'archived' },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    await this.flushCache();
    return club;
  }

  // Get club members with pagination and filtering
  async getMembers(clubId, { page = 1, limit = 20, role, status }) {
    const query = { club: clubId };
    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [total, members] = await Promise.all([
      Membership.countDocuments(query),
      Membership.find(query)
        .populate('user', 'profile.name profile.email rollNumber')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
    ]);

    return { total, page, limit, members };
  }

  // Add member to club
  async addMember(clubId, userId, role, userContext) {
    // Check if user is already a member
    const existing = await Membership.findOne({ club: clubId, user: userId });
    if (existing) {
      const err = new Error('User is already a member');
      err.statusCode = 409;
      throw err;
    }

    const membership = await Membership.create({
      club: clubId,
      user: userId,
      role,
      status: 'approved'
    });

    await auditService.log({
      user: userContext.id,
      action: 'MEMBER_ADD',
      target: `Club:${clubId}`,
      newValue: { userId, role },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return membership;
  }

  // Update member role
  async updateMemberRole(clubId, memberId, role, userContext) {
    const membership = await Membership.findOneAndUpdate(
      { _id: memberId, club: clubId },
      { role },
      { new: true }
    );

    if (!membership) {
      const err = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }

    await auditService.log({
      user: userContext.id,
      action: 'MEMBER_ROLE_UPDATE',
      target: `Membership:${memberId}`,
      newValue: { role },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return membership;
  }

  // Remove member from club
  async removeMember(clubId, memberId, userContext) {
    const membership = await Membership.findOneAndDelete({ _id: memberId, club: clubId });

    if (!membership) {
      const err = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }

    await auditService.log({
      user: userContext.id,
      action: 'MEMBER_REMOVE',
      target: `Membership:${memberId}`,
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });
  }

  // Get club analytics
  async getAnalytics(clubId, { period = 'month', startDate, endDate }) {
    const now = new Date();
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = now;
          break;
        case 'quarter':
          start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          end = now;
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          end = now;
          break;
      }
    }

    const [
      totalMembers,
      memberGrowth,
      eventCount,
      budgetUsed,
      recruitmentStats
    ] = await Promise.all([
      Membership.countDocuments({ club: clubId, status: 'approved' }),
      Membership.countDocuments({ 
        club: clubId, 
        status: 'approved',
        createdAt: { $gte: start, $lte: end }
      }),
      mongoose.model('Event').countDocuments({ 
        club: clubId,
        dateTime: { $gte: start, $lte: end }
      }),
      mongoose.model('BudgetRequest').aggregate([
        { $match: { 
          event: { $in: await mongoose.model('Event').find({ club: clubId }).distinct('_id') },
          status: 'settled',
          createdAt: { $gte: start, $lte: end }
        }},
        { $group: { _id: null, total: { $sum: '$amount' } }}
      ]),
      mongoose.model('Recruitment').aggregate([
        { $match: { club: clubId, createdAt: { $gte: start, $lte: end } }},
        { $group: { _id: '$status', count: { $sum: 1 } }}
      ])
    ]);

    return {
      totalMembers,
      memberGrowth,
      eventCount,
      budgetUsed: budgetUsed[0]?.total || 0,
      recruitmentStats: recruitmentStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }

  // Upload club banner
  async uploadBanner(clubId, bannerFile, userContext) {
    if (!bannerFile) {
      const err = new Error('No banner file provided');
      err.statusCode = 400;
      throw err;
    }

    const res = await cloudinary.uploader.upload(bannerFile.path, {
      folder: `clubs/${clubId}/banner`,
      width: 1200,
      height: 400,
      crop: 'limit'
    });

    const club = await Club.findByIdAndUpdate(
      clubId,
      { bannerUrl: res.secure_url },
      { new: true }
    );

    if (!club) {
      const err = new Error('Club not found');
      err.statusCode = 404;
      throw err;
    }

    await auditService.log({
      user: userContext.id,
      action: 'CLUB_BANNER_UPLOAD',
      target: `Club:${clubId}`,
      newValue: { bannerUrl: res.secure_url },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    await this.flushCache();
    return club;
  }
}

module.exports = new ClubService();