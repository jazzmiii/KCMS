const mongoose = require('mongoose');
const Club = mongoose.model('Club');
const Event = mongoose.model('Event');
const User = mongoose.model('User');
const Document = mongoose.model('Document');
const Membership = mongoose.model('Membership');
const redis = require('../../config/redis');

class SearchService {
  // Global search with caching and advanced filtering
  async globalSearch(params) {
    const {
      q, type, category, status, department,
      dateFrom, dateTo, page = 1, limit = 20
    } = params;

    // Create cache key
    const cacheKey = `search:${JSON.stringify({ q, type, category, status, department, dateFrom, dateTo, page, limit })}`;
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;
    const tasks = [];
    const results = {};

    // Build search query with regex (no text index required)
    const buildQuery = (model, textFields, extra = {}, populateFields = []) => {
      let query = { ...extra };
      
      if (q && q.trim()) {
        // Use regex search (works without indexes)
        const regex = new RegExp(q.trim(), 'i');
        const orConditions = textFields.map(field => ({ [field]: regex }));
        query.$or = orConditions;
      }
      
      let queryBuilder = model.find(query)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit);
      
      // Only populate specified fields
      populateFields.forEach(field => {
        queryBuilder = queryBuilder.populate(field.path, field.select);
      });
      
      return queryBuilder.lean();
    };

    // Search clubs (no populate needed)
    if (!type || type === 'club') {
      const extra = {};
      if (category) extra.category = category;
      if (status) extra.status = status;
      tasks.push(buildQuery(Club, ['name','description'], extra, [])
        .then(d => (results.clubs = d)));
    }

    // Search events (populate club)
    if (!type || type === 'event') {
      const extra = {};
      if (dateFrom || dateTo) {
        extra.dateTime = {};
        if (dateFrom) extra.dateTime.$gte = new Date(dateFrom);
        if (dateTo)   extra.dateTime.$lte = new Date(dateTo);
      }
      tasks.push(buildQuery(Event, ['title','description'], extra, [
        { path: 'club', select: 'name' }
      ]).then(d => (results.events = d)));
    }

    // Search users (no populate needed)
    if (!type || type === 'user') {
      const extra = {};
      if (department) extra['profile.department'] = department;
      tasks.push(buildQuery(User, ['profile.name','rollNumber','email'], extra, [])
        .then(d => (results.users = d)));
    }

    // Search documents (populate club and uploadedBy)
    if (!type || type === 'document') {
      tasks.push(buildQuery(Document, ['metadata.filename'], {}, [
        { path: 'club', select: 'name' },
        { path: 'uploadedBy', select: 'profile.name' }
      ]).then(d => (results.documents = d)));
    }

    await Promise.all(tasks);
    
    // Add pagination info
    results.page = page; 
    results.limit = limit;
    results.query = q;

    // Cache results for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(results));
    
    return results;
  }

  // Recommend clubs for a student
  async recommendClubs(user) {
    const dept = user.profile.department;
    // 1) Dept clubs
    const deptClubs = await Club.find({ category: dept, status: 'active' })
      .lean().limit(5);

    // 2) Trending clubs by membership size
    const trending = await Membership.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$club', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: 'clubs', localField: '_id', foreignField: '_id',
          as: 'club'
      }},
      { $unwind: '$club' },
      { $replaceRoot: { newRoot: '$club' } }
    ]);

    // 3) Friends' clubs (stub: empty)
    const friendsClubs = [];

    return { deptClubs, trending, friendsClubs };
  }

  // Recommend users for a club
  async recommendUsers(clubId) {
    // 1) Potential members: students not in club
    const memberIds = await Membership.find({ club: clubId, status: 'approved' })
      .distinct('user');
    const potential = await User.find({
      'roles.global': 'student',
      _id: { $nin: memberIds }
    }).select('profile.name').limit(5).lean();

    // 2) Trending users by # clubs
    const trending = await Membership.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: {
           from: 'users', localField: '_id', foreignField: '_id',
           as: 'user'
      }},
      { $unwind: '$user' },
      { $replaceRoot: { newRoot: '$user' } }
    ]);

    return { potential, trending };
  }

  // Advanced search with filters
  async advancedSearch(params) {
    const {
      q, types = [], filters = {}, page = 1, limit = 20, sortBy = 'relevance'
    } = params;

    const skip = (page - 1) * limit;
    const results = {};

    for (const type of types) {
      switch (type) {
        case 'club':
          results.clubs = await this.searchClubs(q, filters.club, skip, limit, sortBy);
          break;
        case 'event':
          results.events = await this.searchEvents(q, filters.event, skip, limit, sortBy);
          break;
        case 'user':
          results.users = await this.searchUsers(q, filters.user, skip, limit, sortBy);
          break;
        case 'document':
          results.documents = await this.searchDocuments(q, filters.document, skip, limit, sortBy);
          break;
      }
    }

    return { ...results, page, limit, query: q };
  }

  // Search clubs with advanced filters
  async searchClubs(query, filters = {}, skip = 0, limit = 20, sortBy = 'relevance') {
    let searchQuery = {};

    if (query) {
      const regex = new RegExp(query, 'i');
      searchQuery.$or = [
        { name: regex },
        { description: regex },
        { vision: regex },
        { mission: regex }
      ];
    }

    // Apply filters
    if (filters.category) searchQuery.category = filters.category;
    if (filters.status) searchQuery.status = filters.status;
    if (filters.coordinator) searchQuery.coordinator = filters.coordinator;

    let sortOptions = {};
    switch (sortBy) {
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'created':
        sortOptions = { createdAt: -1 };
        break;
      case 'members':
        // Would need aggregation for member count
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    return Club.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('coordinator', 'profile.name')
      .lean();
  }

  // Search events with advanced filters
  async searchEvents(query, filters = {}, skip = 0, limit = 20, sortBy = 'relevance') {
    let searchQuery = {};

    if (query) {
      const regex = new RegExp(query, 'i');
      searchQuery.$or = [
        { title: regex },
        { description: regex },
        { objectives: regex }
      ];
    }

    // Apply filters
    if (filters.club) searchQuery.club = filters.club;
    if (filters.status) searchQuery.status = filters.status;
    if (filters.isPublic !== undefined) searchQuery.isPublic = filters.isPublic;
    if (filters.dateFrom || filters.dateTo) {
      searchQuery.dateTime = {};
      if (filters.dateFrom) searchQuery.dateTime.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) searchQuery.dateTime.$lte = new Date(filters.dateTo);
    }

    let sortOptions = {};
    switch (sortBy) {
      case 'date':
        sortOptions = { dateTime: 1 };
        break;
      case 'title':
        sortOptions = { title: 1 };
        break;
      default:
        sortOptions = { dateTime: -1 };
    }

    return Event.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('club', 'name logoUrl')
      .lean();
  }

  // Search users with advanced filters
  async searchUsers(query, filters = {}, skip = 0, limit = 20, sortBy = 'relevance') {
    let searchQuery = {};

    if (query) {
      const regex = new RegExp(query, 'i');
      searchQuery.$or = [
        { 'profile.name': regex },
        { rollNumber: regex },
        { email: regex }
      ];
    }

    // Apply filters
    if (filters.department) searchQuery['profile.department'] = filters.department;
    if (filters.batch) searchQuery['profile.batch'] = filters.batch;
    if (filters.year) searchQuery['profile.year'] = filters.year;
    if (filters.role) searchQuery['roles.global'] = filters.role;
    if (filters.status) searchQuery.status = filters.status;

    let sortOptions = {};
    switch (sortBy) {
      case 'name':
        sortOptions = { 'profile.name': 1 };
        break;
      case 'rollNumber':
        sortOptions = { rollNumber: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    return User.find(searchQuery)
      .select('-passwordHash')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  // Search documents with advanced filters
  async searchDocuments(query, filters = {}, skip = 0, limit = 20, sortBy = 'relevance') {
    let searchQuery = {};

    if (query) {
      const regex = new RegExp(query, 'i');
      searchQuery.$or = [
        { 'metadata.filename': regex },
        { album: regex }
      ];
    }

    // Apply filters
    if (filters.club) searchQuery.club = filters.club;
    if (filters.type) searchQuery.type = filters.type;
    if (filters.album) searchQuery.album = filters.album;

    let sortOptions = {};
    switch (sortBy) {
      case 'filename':
        sortOptions = { 'metadata.filename': 1 };
        break;
      case 'size':
        sortOptions = { 'metadata.size': -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    return Document.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('club', 'name')
      .populate('uploadedBy', 'profile.name')
      .lean();
  }

  // Get search suggestions
  async getSuggestions(query, limit = 5) {
    if (!query || query.length < 2) return [];

    const regex = new RegExp(query, 'i');
    
    const [clubs, events, users] = await Promise.all([
      Club.find({ name: regex }).select('name').limit(limit).lean(),
      Event.find({ title: regex }).select('title').limit(limit).lean(),
      User.find({ 'profile.name': regex }).select('profile.name rollNumber').limit(limit).lean()
    ]);

    return {
      clubs: clubs.map(c => ({ type: 'club', text: c.name, id: c._id })),
      events: events.map(e => ({ type: 'event', text: e.title, id: e._id })),
      users: users.map(u => ({ type: 'user', text: u.profile.name, id: u._id, rollNumber: u.rollNumber }))
    };
  }

  // Count methods for pagination
  async getClubCount(query, filters = {}) {
    let searchQuery = {};
    
    if (query) {
      const regex = new RegExp(query, 'i');
      searchQuery.$or = [
        { name: regex },
        { description: regex },
        { vision: regex },
        { mission: regex }
      ];
    }
    
    if (filters.category) searchQuery.category = filters.category;
    if (filters.status) searchQuery.status = filters.status;
    
    return Club.countDocuments(searchQuery);
  }

  async getEventCount(query, filters = {}) {
    let searchQuery = {};
    
    if (query) {
      const regex = new RegExp(query, 'i');
      searchQuery.$or = [
        { title: regex },
        { description: regex },
        { objectives: regex }
      ];
    }
    
    if (filters.club) searchQuery.club = filters.club;
    if (filters.status) searchQuery.status = filters.status;
    if (filters.isPublic !== undefined) searchQuery.isPublic = filters.isPublic;
    
    return Event.countDocuments(searchQuery);
  }

  async getUserCount(query, filters = {}) {
    let searchQuery = {};
    
    if (query) {
      const regex = new RegExp(query, 'i');
      searchQuery.$or = [
        { 'profile.name': regex },
        { rollNumber: regex },
        { email: regex }
      ];
    }
    
    if (filters.department) searchQuery['profile.department'] = filters.department;
    if (filters.batch) searchQuery['profile.batch'] = filters.batch;
    if (filters.year) searchQuery['profile.year'] = filters.year;
    if (filters.role) searchQuery['roles.global'] = filters.role;
    if (filters.status) searchQuery.status = filters.status;
    
    return User.countDocuments(searchQuery);
  }

  async getDocumentCount(query, filters = {}) {
    let searchQuery = {};
    
    if (query) {
      const regex = new RegExp(query, 'i');
      searchQuery.$or = [
        { 'metadata.filename': regex },
        { album: regex }
      ];
    }
    
    if (filters.club) searchQuery.club = filters.club;
    if (filters.type) searchQuery.type = filters.type;
    if (filters.album) searchQuery.album = filters.album;
    
    return Document.countDocuments(searchQuery);
  }
}

module.exports = new SearchService();