const rateLimit = require('express-rate-limit');

// 5 attempts per 15 min
const loginLimiter = rateLimit({
  windowMs: 15*60*1000,
  max: 5,
  message: { status:'error', message:'Too many login attempts. Try in 15 minutes.' },
  keyGenerator: (req) => req.body.identifier || req.ip
});

module.exports = { loginLimiter };