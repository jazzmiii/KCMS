//src/modules/recruitment/recruitment.routes.js
const router       = require('express').Router();
const authenticate = require('../../middlewares/auth');
const { requireEither } = require('../../middlewares/permission');
const validate     = require('../../middlewares/validate');
const v            = require('./recruitment.validators');
const ctrl         = require('./recruitment.controller');

// Create Recruitment (President can create recruitment - Section 4.1)
router.post(
  '/',
  authenticate,
  requireEither(['admin'], ['president']), // Admin OR Club President
  validate(v.createSchema),
  ctrl.create
);

// Update Recruitment (Core+ can update recruitment - Section 4.1)
router.patch(
  '/:id',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.recruitmentId, 'params'),
  validate(v.updateSchema),
  ctrl.update
);

// Schedule/Open/Close (Core+ can manage lifecycle - Section 4.1)
router.post(
  '/:id/status',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.recruitmentId, 'params'),
  validate(v.lifecycleSchema),
  ctrl.changeStatus
);

// List Recruitments (Public - Section 4.2)
router.get(
  '/',
  validate(v.listSchema, 'query'),
  ctrl.list
);

// Get By ID (Public for open ones - Section 4.2)
router.get(
  '/:id',
  validate(v.recruitmentId, 'params'),
  ctrl.getById
);

// Apply (Students can apply - Section 4.2)
router.post(
  '/:id/apply',
  authenticate,
  validate(v.recruitmentId, 'params'),
  validate(v.applySchema),
  ctrl.apply
);

// List Applications (Core+ can view applications - Section 4.3)
router.get(
  '/:id/applications',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.recruitmentId, 'params'),
  validate(v.listSchema, 'query'),
  ctrl.listApplications
);

// Review Single Application (Core+ can review applications - Section 4.3)
router.patch(
  '/:id/applications/:appId',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.recruitmentId, 'params'),
  validate(v.reviewSchema),
  ctrl.review
);

// Bulk Review (Core+ can bulk review - Section 4.3)
router.patch(
  '/:id/applications',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.recruitmentId, 'params'),
  validate(v.bulkReviewSchema),
  ctrl.bulkReview
);

module.exports = router;