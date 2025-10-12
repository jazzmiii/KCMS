const Joi = require('joi');
const { Types } = require('mongoose');
const objectId = Joi.string().custom((v,h)=>
  Types.ObjectId.isValid(v) ? v : h.error('invalid id')
);

module.exports = {
  listSchema: Joi.object({
    user: objectId.optional(),
    action: Joi.string().optional(),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};