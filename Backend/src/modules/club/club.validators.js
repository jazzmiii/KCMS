//src/modules/club/club.validators.js
const Joi = require('joi');
const { Types } = require('mongoose');

const objectId = Joi.string().custom((val, helper) =>
  Types.ObjectId.isValid(val) ? val : helper.error('any.invalid')
);

module.exports = {
  createClub: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    category: Joi.string()
      .valid('technical','cultural','sports','arts','social')
      .required(),
    description: Joi.string().min(50).max(500).required(),
    vision: Joi.string().max(500).required(),
    mission: Joi.string().max(500).required(),
    coordinator: objectId.required(),  // Faculty coordinator (oversight role)
    president: objectId.required(),    // Student president (leadership role)
    coreMembers: Joi.array().items(objectId).optional()
  }),

  listClubsSchema: Joi.object({
    category: Joi.string().valid('technical','cultural','sports','arts','social'),
    search: Joi.string().allow(''),
    coordinator: objectId.optional(),  // ✅ Allow filtering by coordinator
    _t: Joi.number().optional(),       // ✅ Allow cache-busting timestamp
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  clubId: Joi.object({
    clubId: objectId.required()
  }),

  updateSettings: Joi.object({
    // public fields
    description: Joi.string().min(50).max(500),
    vision: Joi.string().max(500),
    mission: Joi.string().max(500),
    socialLinks: Joi.object({
      facebook: Joi.string().uri(),
      twitter: Joi.string().uri(),
      instagram: Joi.string().uri()
    }),
    bannerUrl: Joi.string().uri(),

    // protected fields
    name: Joi.string().min(3).max(50),
    category: Joi.string().valid('technical','cultural','sports','arts','social'),
    coreMembers: Joi.array().items(objectId)
  }).min(1),

  approveSettingsSchema: Joi.object({}),
  
  approveClubSchema: Joi.object({
    action: Joi.string().valid('submit','approve').required()
  }),

  archiveClubSchema: Joi.object({}),

  getMembersSchema: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    role: Joi.string().valid('member','core','president','vicePresident','secretary','treasurer','leadPR','leadTech'),
    status: Joi.string().valid('applied','approved','rejected')
  }),

  memberId: Joi.object({
    memberId: objectId.required()
  }),

  addMemberSchema: Joi.object({
    userId: objectId.required(),
    role: Joi.string().valid('member','core','president','vicePresident','secretary','treasurer','leadPR','leadTech').required()
  }),

  updateMemberRoleSchema: Joi.object({
    role: Joi.string().valid('member','core','president','vicePresident','secretary','treasurer','leadPR','leadTech').required()
  }),

  analyticsSchema: Joi.object({
    period: Joi.string().valid('week','month','quarter','year').default('month'),
    startDate: Joi.date(),
    endDate: Joi.date()
  })
};