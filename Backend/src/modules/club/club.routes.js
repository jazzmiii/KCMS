//src/modules/club/club.routes.js
const router       = require('express').Router();
const authenticate = require('../../middlewares/auth');
const { 
  permit, 
  requireAdmin, 
  requireClubRole, 
  requireEither, 
  requireAssignedCoordinator,
  requireAdminOrCoordinatorOrClubRole,
  requirePresident
} = require('../../middlewares/permission');
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

// Update Settings (President ONLY can edit, Coordinator approval for protected - Section 3.3)
router.patch(
  '/:clubId/settings',
  authenticate,
  requirePresident(), // ✅ Admin OR ONLY Club President (not other core members)
  validate(v.clubId, 'params'),
  validate(v.updateSettings),
  ctrl.updateSettings
);

// Approve protected settings (Assigned Coordinator only - Section 3.3)
router.post(
  '/:clubId/settings/approve',
  authenticate,
  requireAssignedCoordinator(), // Admin OR Assigned Coordinator only
  validate(v.clubId, 'params'),
  validate(v.approveSettingsSchema),
  ctrl.approveSettings
);

// NOTE: Club approval route removed - Admin creates clubs directly as 'active'
// Only settings changes require coordinator approval (see /settings/approve above)

// Archive Club (Admin OR Club President ONLY - Section 3.3)
router.delete(
  '/:clubId',
  authenticate,
  requirePresident(), // ✅ Admin OR ONLY Club President
  validate(v.clubId, 'params'),
  ctrl.archiveClub
);

// Get club members (Members can view, Core+ can manage - Section 2.2)
router.get(
  '/:clubId/members',
  authenticate,
  requireAdminOrCoordinatorOrClubRole(['member', 'core', 'president']), // Admin OR Assigned Coordinator OR Club Members
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

// Update member role (President ONLY can assign roles - Section 2.2)
router.patch(
  '/:clubId/members/:memberId',
  authenticate,
  requirePresident(), // ✅ Admin OR ONLY Club President
  validate(v.clubIdAndMemberId, 'params'),
  validate(v.updateMemberRoleSchema),
  ctrl.updateMemberRole
);

// Remove member from club (President ONLY can remove members - Section 2.2)
router.delete(
  '/:clubId/members/:memberId',
  authenticate,
  requirePresident(), // ✅ Admin OR ONLY Club President
  validate(v.clubIdAndMemberId, 'params'),
  ctrl.removeMember
);

// Get club analytics (Core+ can view analytics - Section 2.2)
router.get(
  '/:clubId/analytics',
  authenticate,
  requireAdminOrCoordinatorOrClubRole(['core', 'president']), // Admin OR Assigned Coordinator OR Club Core+
  validate(v.clubId, 'params'),
  validate(v.analyticsSchema, 'query'),
  ctrl.getAnalytics
);

// Upload club banner (President ONLY can upload banner - Section 3.3)
router.post(
  '/:clubId/banner',
  authenticate,
  requirePresident(), // ✅ Admin OR ONLY Club President
  validate(v.clubId, 'params'),
  upload.single('banner'),
  validateUpload('image'), // Validate file type, size, and security
  ctrl.uploadBanner
);

module.exports = router;