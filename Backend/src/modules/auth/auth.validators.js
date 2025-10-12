// src/modules/auth/auth.validators.js
const Joi = require('joi');
const passwordPattern = /^(?!.*(?:123456|password|qwerty)).*$/;

module.exports = {
  register: Joi.object({
    rollNumber: Joi.string().pattern(/^[0-9]{2}[Bb][Dd][A-Za-z0-9]{6}$/).required(),
    email:      Joi.string().email().required(),
    password:   Joi.string().min(8)
                    .pattern(/[A-Z]/).pattern(/[a-z]/)
                    .pattern(/\d/).pattern(/[^A-Za-z0-9]/)
                    .pattern(passwordPattern).required(),
    confirmPassword: Joi.any().valid(Joi.ref('password')).required()
                          .messages({'any.only':'Passwords must match'})
  }),

  verifyOtp: Joi.object({
    email: Joi.string().email().required(),
    otp:   Joi.string().length(6).pattern(/^\d{6}$/).required()
  }),

  completeProfile: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    department: Joi.string().required(),
    batch: Joi.string().required(),
    year: Joi.number().integer().min(1900).max(2100).required(),
    phone: Joi.string().optional(),
    profilePhoto: Joi.string().uri().optional(),
    linkedIn: Joi.string().uri().optional(),
    github: Joi.string().uri().optional()
  }),

  login: Joi.object({
    identifier: Joi.string().required(), // email or rollNumber
    password: Joi.string().required()
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().hex().length(80).required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  verifyReset: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^\d{6}$/).required()
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^\d{6}$/).required(),
    newPassword: Joi.string().min(8)
                     .pattern(/[A-Z]/).pattern(/[a-z]/)
                     .pattern(/\d/).pattern(/[^A-Za-z0-9]/)
                     .pattern(passwordPattern).required(),
    confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required()
                          .messages({'any.only':'Passwords must match'})
  })
};