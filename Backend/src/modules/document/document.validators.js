const Joi = require('joi');
const { Types } = require('mongoose');

const objectId = Joi.string().custom((v, h) =>
  Types.ObjectId.isValid(v) ? v : h.error('invalid id')
);

module.exports = {
  clubIdParam: Joi.object({
    clubId: objectId.required()
  }),

  uploadSchema: Joi.object({
    album: Joi.string().max(50).optional(),
    tags: Joi.array().items(objectId).optional()
  }),

  listSchema: Joi.object({
    type: Joi.string().valid('photo','document','video').optional(),
    album: Joi.string().optional(),
    year: Joi.number().integer().min(2000).max(2100).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  docIdParam: Joi.object({
    docId: objectId.required()
  }),

  createAlbumSchema: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    eventId: objectId.optional()  // Allow linking album to event
  }),

  tagMembersSchema: Joi.object({
    memberIds: Joi.array().items(objectId).min(1).required()
  }),

  analyticsSchema: Joi.object({
    period: Joi.string().valid('week', 'month', 'quarter', 'year').default('month')
  }),

  searchSchema: Joi.object({
    q: Joi.string().min(1).max(100),
    type: Joi.string().valid('photo', 'document'),
    album: Joi.string(),
    uploadedBy: objectId
  })
};