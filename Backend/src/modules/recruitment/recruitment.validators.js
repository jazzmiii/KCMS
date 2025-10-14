//src/modules/recruitment/recruitment.validators.js
const Joi = require('joi');
const { Types } = require('mongoose');

const objectId = Joi.string().custom((v, h) =>
  Types.ObjectId.isValid(v) ? v : h.error('invalid id')
);

module.exports = {
  createSchema: Joi.object({
    club: objectId.required(),
    title: Joi.string().max(100).required(),
    description: Joi.string().max(1000).required(),
    eligibility: Joi.string().max(500).optional(),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    positions: Joi.array().items(Joi.string()).optional(),
    customQuestions: Joi.array().items(Joi.string()).max(5).optional()
  }),

  updateSchema: Joi.object({
    title: Joi.string().max(100),
    description: Joi.string().max(1000),
    eligibility: Joi.string().max(500),
    startDate: Joi.date(),
    endDate: Joi.date(),
    positions: Joi.array().items(Joi.string()),
    customQuestions: Joi.array().items(Joi.string()).max(5)
  }).min(1),

  lifecycleSchema: Joi.object({
    action: Joi.string().valid('schedule','open','close').required()
  }),

  listSchema: Joi.object({
    club: objectId,
    status: Joi.string().valid(
      'draft','scheduled','open','closing_soon','closed','selection_done'
    ),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  recruitmentId: Joi.object({
    id: objectId.required()
  }),

  recruitmentIdAndAppId: Joi.object({
    id: objectId.required(),
    appId: objectId.required()
  }),

  applySchema: Joi.object({
    answers: Joi.array()
      .items(
        Joi.object({ question: Joi.string().required(), answer: Joi.string().required() })
      )
      .min(1)
      .required()
  }),

  reviewSchema: Joi.object({
    status: Joi.string().valid('selected','rejected','waitlisted').required(),
    score: Joi.number().min(0).optional()
  }),

  bulkReviewSchema: Joi.object({
    applicationIds: Joi.array().items(objectId).min(1).required(),
    status: Joi.string().valid('selected','rejected','waitlisted').required()
  })
};