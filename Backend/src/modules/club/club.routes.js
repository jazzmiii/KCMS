//src/modules/club/club.routes.js
const router       = require('express').Router();
const authenticate = require('../../middlewares/auth');
const { permit, requireAdmin, requireClubRole, requireEither } = require('../../middlewares/permission');
const validate     = require('../../middlewares/validate');
const { validateUpload } = require('../../middlewares/fileValidator');
const multer       = require('multer');
const upload       = multer({ dest: 'uploads/' });
const v            = require('./club.validators');
const ctrl         = require('./club.controller');

// Create Club (Admin only - Section 3.1)
router.post(
  '/',
  authenticate,
  requireAdmin(),
  upload.single('logo'),
  validateUpload('image'), // Validate file type, size, and security
  validate(v.createClub),
  ctrl.createClub
);

// List Active Clubs (Public - Section 3.2)
router.get(
  '/',
  validate(v.listClubsSchema, 'query'),
  ctrl.listClubs
);

// Get Club Details (Public for basic info, Members for internal - Section 3.2)
router.get(
  '/:clubId',
  authenticate,
  validate(v.clubId, 'params'),
  ctrl.getClub
);

// Update Settings (President can edit public settings, Coordinator approval for protected - Section 3.3)
router.patch(
  '/:clubId/settings',
  authenticate,
  requireEither(['admin'], ['president']), // Admin OR Club President
  validate(v.clubId, 'params'),
  validate(v.updateSettings),
  ctrl.updateSettings
);

// Approve protected settings (Coordinator only - Section 3.3)
router.post(
  '/:clubId/settings/approve',
  authenticate,
  permit({ global: ['admin', 'coordinator'] }), // Admin OR Coordinator
  validate(v.clubId, 'params'),
  validate(v.approveSettingsSchema),
  ctrl.approveSettings
);

// Approval Workflow (Coordinator approves club creation - Section 3.1)
router.patch(
  '/:clubId/approve',
  authenticate,
  permit({ global: ['admin', 'coordinator'] }), // Admin OR Coordinator
  validate(v.clubId, 'params'),
  validate(v.approveClubSchema),
  ctrl.approveClub
);

// Archive Club (Admin OR Club President - Section 3.3)
router.delete(
  '/:clubId',
  authenticate,
  requireEither(['admin'], ['president']), // Admin OR Club President
  validate(v.clubId, 'params'),
  ctrl.archiveClub
);

// Get club members (Members can view, Core+ can manage - Section 2.2)
router.get(
  '/:clubId/members',
  authenticate,
  requireEither(['admin', 'coordinator'], ['member', 'core', 'president']), // Admin/Coordinator OR Club Members
  validate(v.clubId, 'params'),
  validate(v.getMembersSchema, 'query'),
  ctrl.getMembers
);

// Add member to club (Core+ can add members - Section 2.2)
router.post(
  '/:clubId/members',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.clubId, 'params'),
  validate(v.addMemberSchema),
  ctrl.addMember
);

// Update member role (President can assign roles - Section 2.2)
router.patch(
  '/:clubId/members/:memberId',
  authenticate,
  requireEither(['admin'], ['president']), // Admin OR Club President
  validate(v.clubId, 'params'),
  validate(v.memberId, 'params'),
  validate(v.updateMemberRoleSchema),
  ctrl.updateMemberRole
);

// Remove member from club (President can remove members - Section 2.2)
router.delete(
  '/:clubId/members/:memberId',
  authenticate,
  requireEither(['admin'], ['president']), // Admin OR Club President
  validate(v.clubId, 'params'),
  validate(v.memberId, 'params'),
  ctrl.removeMember
);

// Get club analytics (Core+ can view analytics - Section 2.2)
router.get(
  '/:clubId/analytics',
  authenticate,
  requireEither(['admin', 'coordinator'], ['core', 'president']), // Admin/Coordinator OR Club Core+
  validate(v.clubId, 'params'),
  validate(v.analyticsSchema, 'query'),
  ctrl.getAnalytics
);

// Upload club banner (President can upload banner - Section 3.3)
router.post(
  '/:clubId/banner',
  authenticate,
  requireEither(['admin'], ['president']), // Admin OR Club President
  validate(v.clubId, 'params'),
  upload.single('banner'),
  validateUpload('image'), // Validate file type, size, and security
  ctrl.uploadBanner
);

module.exports = router;