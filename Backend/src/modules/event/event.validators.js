const Joi = require('joi');
const { Types } = require('mongoose');
const objectId = Joi.string().custom((v,h)=>
  Types.ObjectId.isValid(v)?v:h.error('invalid id')
);

module.exports = {
  createEvent: Joi.object({
    club: objectId.required(),
    title: Joi.string().max(100).required(),
    description: Joi.string().max(1000).optional(),
    objectives: Joi.string().max(500).optional(),
    dateTime: Joi.date().required(),
    duration: Joi.number().min(0).required(),
    venue: Joi.string().max(200).optional(),
    capacity: Joi.number().min(0).optional(),
    expectedAttendees: Joi.number().min(0).optional(),
    isPublic: Joi.boolean().optional(),
    budget: Joi.number().min(0).optional(),
    guestSpeakers: Joi.array().items(Joi.string()).optional()
  }),

  eventId: Joi.object({ id: objectId.required() }),

  changeStatus: Joi.object({
    action: Joi.string().valid('submit','approve','publish','start','complete').required()
  }),

  rsvp: Joi.object({}),

  attendance: Joi.object({
    userId: objectId.optional(), // for admin/qr mark
    qrCode: Joi.string().optional()
  }),

  budgetRequest: Joi.object({
    amount: Joi.number().min(0).required(),
    breakdown: Joi.string().max(1000).optional(),
    quotations: Joi.array().items(Joi.string().uri()).optional()
  }),

  settleBudget: Joi.object({
    reportUrl: Joi.string().uri().required(),
    unusedFunds: Joi.number().min(0).optional()
  })
};