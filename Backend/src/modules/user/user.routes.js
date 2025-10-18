// src/modules/user/user.routes.js
const router = require('express').Router();
const authenticate = require('../../middlewares/auth');
const { permit, CORE_AND_PRESIDENT }   = require('../../middlewares/permission');
const validate     = require('../../middlewares/validate');
const { validateUpload } = require('../../middlewares/fileValidator');
const v            = require('./user.validators');
const ctrl         = require('./user.controller');
const multer       = require('multer');

// configure file upload
const upload = multer({ dest: 'uploads/profile/' });

// Self-service
router.get(
  '/me',
  authenticate,
  ctrl.getMe
);

router.patch(
  '/me',
  authenticate,
  validate(v.updateProfileSchema),
  ctrl.updateMe
);

router.put(
  '/me/password',
  authenticate,
  validate(v.changePasswordSchema),
  ctrl.changePassword
);

// New: profile-photo upload
router.post(
  '/me/photo',
  authenticate,
  upload.single('photo'),
  validateUpload('image'), // Validate file type, size, and security
  validate(v.photoUploadParams),
  ctrl.uploadPhoto
);

// New: notification preferences
router.patch(
  '/me/preferences',
  authenticate,
  validate(v.preferencesSchema),
  ctrl.updatePreferences
);

// New: list active sessions
router.get(
  '/me/sessions',
  authenticate,
  ctrl.listSessions
);

// New: revoke a session
router.delete(
  '/me/sessions/:sessionId',
  authenticate,
  validate(v.sessionIdParam, 'params'),
  ctrl.revokeSession
);

// Get my clubs
router.get(
  '/me/clubs',
  authenticate,
  ctrl.getMyClubs
);

// List Users (Admin can see all, Core+ can see students only for adding to clubs)
router.get(
  '/',
  authenticate,
  // All authenticated users can list, service filters: admin sees all, others see only students
  validate(v.listUsersSchema, 'query'),
  ctrl.listUsers
);

router.get(
  '/:id',
  authenticate,
  permit({ global: ['admin'] }),
  validate(v.userIdSchema, 'params'),
  ctrl.getUserById
);

router.patch(
  '/:id',
  authenticate,
  permit({ global: ['admin'] }),
  validate(v.updateUserSchema),
  ctrl.updateUserById
);

router.patch(
  '/:id/role',
  authenticate,
  permit({ global: ['admin'] }),
  validate(v.updateGlobalRoleSchema),
  ctrl.changeUserRole
);

router.delete(
  '/:id',
  authenticate,
  permit({ global: ['admin'] }),
  validate(v.userIdSchema, 'params'),
  ctrl.deleteUser
);

module.exports = router;