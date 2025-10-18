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
                    .pattern(passwordPattern)
                    .custom((value, helpers) => {
                      // Workplan Line 18: Password cannot contain rollNumber
                      const rollNumber = helpers.state.ancestors[0].rollNumber;
                      if (rollNumber && value.toLowerCase().includes(rollNumber.toLowerCase())) {
                        return helpers.error('any.invalid');
                      }
                      return value;
                    })
                    .required()
                    .messages({'any.invalid': 'Password cannot contain your roll number'}),
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
    year: Joi.number().integer().min(1).max(5).required(),
    phone: Joi.string().optional(),
    profilePhoto: Joi.string().uri().optional(),
    linkedIn: Joi.string().uri().optional(),
    github: Joi.string().uri().optional()
  }),

  login: Joi.object({
    identifier: Joi.string().required(), // email or rollNumber
    password: Joi.string().required(),
    rememberDevice: Joi.boolean().optional().default(false) // 30-day remember device feature
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().hex().length(80).required()
  }),

  forgotPassword: Joi.object({
    identifier: Joi.string().required() // email or rollNumber
  }),

  verifyReset: Joi.object({
    identifier: Joi.string().required(), // email or rollNumber
    otp: Joi.string().length(6).pattern(/^\d{6}$/).required()
  }),

  resetPassword: Joi.object({
    identifier: Joi.string().required(), // email or rollNumber
    otp: Joi.string().length(6).pattern(/^\d{6}$/).required(),
    newPassword: Joi.string().min(8)
                     .pattern(/[A-Z]/).pattern(/[a-z]/)
                     .pattern(/\d/).pattern(/[^A-Za-z0-9]/)
                     .pattern(passwordPattern).required(),
    confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required()
                          .messages({'any.only':'Passwords must match'})
  })
};