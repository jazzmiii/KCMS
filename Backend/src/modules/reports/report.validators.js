const Joi = require('joi');
const { Types } = require('mongoose');

const objectId = Joi.string().custom((v,h)=>
  Types.ObjectId.isValid(v)?v:h.error('invalid id')
);

module.exports = {
  dashboardSchema: Joi.object({}),

  clubActivitySchema: Joi.object({
    clubId: objectId.required(),
    year: Joi.number().integer().min(2000).max(2100).required()
  }),

  yearSchema: Joi.object({
    year: Joi.number().integer().min(2000).max(2100).required()
  }),

  listAuditSchema: Joi.object({
    user: objectId.optional(),
    action: Joi.string().optional(),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  clubId: Joi.object({
    clubId: objectId.required()
  }),

  year: Joi.object({
    year: Joi.number().integer().min(2000).max(2100).required()
  }),

  clubIdAndYear: Joi.object({
    clubId: objectId.required(),
    year: Joi.number().integer().min(2000).max(2100).required()
  }),

  eventId: Joi.object({
    eventId: objectId.required()
  })
};