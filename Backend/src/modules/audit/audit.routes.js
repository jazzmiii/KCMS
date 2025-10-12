const router = require('express').Router();
const authenticate = require('../../middlewares/auth');
const permit       = require('../../middlewares/permission');
const validate     = require('../../middlewares/validate');
const v            = require('./audit.validators');
const ctrl         = require('./audit.controller');

// List audit logs (admin only)
router.get(
  '/',
  authenticate,
  permit({ global: ['admin'] }),
  validate(v.listSchema, 'query'),
  ctrl.list
);

module.exports = router;