// src/modules/search/search.validators.js
const Joi = require('joi');
const { Types } = require('mongoose');

const objectId = Joi.string().custom((val, helper) =>
  Types.ObjectId.isValid(val) ? val : helper.error('any.invalid')
);

module.exports = {
  globalSearchSchema: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    type: Joi.string().valid('club', 'event', 'user', 'document'),
    category: Joi.string().valid('technical', 'cultural', 'sports', 'arts', 'social'),
    status: Joi.string(),
    department: Joi.string(),
    dateFrom: Joi.date(),
    dateTo: Joi.date(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  advancedSearchSchema: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    types: Joi.array().items(Joi.string().valid('club', 'event', 'user', 'document')).min(1).required(),
    filters: Joi.object({
      club: Joi.object({
        category: Joi.string().valid('technical', 'cultural', 'sports', 'arts', 'social'),
        status: Joi.string(),
        coordinator: objectId
      }),
      event: Joi.object({
        club: objectId,
        status: Joi.string(),
        isPublic: Joi.boolean(),
        dateFrom: Joi.date(),
        dateTo: Joi.date()
      }),
      user: Joi.object({
        department: Joi.string(),
        batch: Joi.string(),
        year: Joi.number().integer().min(1900).max(2100),
        role: Joi.string().valid('student', 'coordinator', 'admin'),
        status: Joi.string()
      }),
      document: Joi.object({
        club: objectId,
        type: Joi.string().valid('photo', 'document', 'video'),
        album: Joi.string()
      })
    }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('relevance', 'name', 'date', 'created', 'members').default('relevance')
  }),

  suggestionsSchema: Joi.object({
    q: Joi.string().min(2).max(50).required(),
    limit: Joi.number().integer().min(1).max(10).default(5)
  }),

  clubId: Joi.object({
    clubId: objectId.required()
  }),

  clubSearchSchema: Joi.object({
    q: Joi.string().min(1).max(100),
    category: Joi.string().valid('technical', 'cultural', 'sports', 'arts', 'social'),
    status: Joi.string(),
    coordinator: objectId,
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('relevance', 'name', 'created', 'members').default('relevance')
  }),

  eventSearchSchema: Joi.object({
    q: Joi.string().min(1).max(100),
    club: objectId,
    status: Joi.string(),
    isPublic: Joi.boolean(),
    dateFrom: Joi.date(),
    dateTo: Joi.date(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('relevance', 'date', 'title').default('relevance')
  }),

  userSearchSchema: Joi.object({
    q: Joi.string().min(1).max(100),
    department: Joi.string(),
    batch: Joi.string(),
    year: Joi.number().integer().min(1900).max(2100),
    role: Joi.string().valid('student', 'coordinator', 'admin'),
    status: Joi.string(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('relevance', 'name', 'rollNumber').default('relevance')
  }),

  documentSearchSchema: Joi.object({
    q: Joi.string().min(1).max(100),
    club: objectId,
    type: Joi.string().valid('photo', 'document', 'video'),
    album: Joi.string(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('relevance', 'filename', 'size').default('relevance')
  })
};