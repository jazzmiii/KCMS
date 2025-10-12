const Joi = require('joi');
const { Types } = require('mongoose');
const objectId = Joi.string().custom((v,h)=>
  Types.ObjectId.isValid(v) ? v : h.error('any.invalid')
);

module.exports = {
  createNotification: Joi.object({
    user: objectId.required(),
    type: Joi.string().valid(
      'recruitment_open','recruitment_closing','application_status',
      'event_reminder','approval_required','role_assigned','system_maintenance'
    ).required(),
    payload: Joi.object().optional(),
    priority: Joi.string().valid('URGENT','HIGH','MEDIUM','LOW').optional(),
  }),

  listNotifications: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().optional(),
    priority: Joi.string().optional(),
    isRead: Joi.boolean().optional()
  }),

  notifId: Joi.object({
    id: objectId.required()
  }),

  markRead: Joi.object({
    isRead: Joi.boolean().required()
  })
};