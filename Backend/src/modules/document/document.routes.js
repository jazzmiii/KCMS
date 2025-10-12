const router       = require('express').Router({ mergeParams: true });
const authenticate = require('../../middlewares/auth');
const { permit, requireEither } = require('../../middlewares/permission');
const validate     = require('../../middlewares/validate');
const multer       = require('multer');
const upload       = multer({ dest: 'uploads/' });
const v            = require('./document.validators');
const ctrl         = require('./document.controller');

// Upload (single/multiple) - Core+ can upload media (Section 7.1)
router.post(
  '/upload',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.clubIdParam, 'params'),
  upload.array('files', 10),
  validate(v.uploadSchema),
  ctrl.upload
);

// List / Gallery - Members can view, Core+ can manage (Section 7.2)
router.get(
  '/',
  authenticate,
  requireEither(['admin', 'coordinator'], ['member', 'core', 'president']), // Admin/Coordinator OR Club Members
  validate(v.clubIdParam, 'params'),
  validate(v.listSchema, 'query'),
  ctrl.list
);

// Download Original - Members can download (Section 7.2)
router.get(
  '/:docId/download',
  authenticate,
  requireEither(['admin', 'coordinator'], ['member', 'core', 'president']), // Admin/Coordinator OR Club Members
  validate(v.docIdParam, 'params'),
  ctrl.download
);

// Delete Document - President can delete (Section 7.2)
router.delete(
  '/:docId',
  authenticate,
  requireEither(['admin'], ['president']), // Admin OR Club President
  validate(v.docIdParam, 'params'),
  ctrl.delete
);

// Create Album - Core+ can create albums (Section 7.2)
router.post(
  '/albums',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.createAlbumSchema),
  ctrl.createAlbum
);

// Get Albums - Members can view albums (Section 7.2)
router.get(
  '/albums',
  authenticate,
  requireEither(['admin', 'coordinator'], ['member', 'core', 'president']), // Admin/Coordinator OR Club Members
  ctrl.getAlbums
);

// Bulk Upload - Core+ can bulk upload (Section 7.2)
router.post(
  '/bulk-upload',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  upload.array('files', 10),
  ctrl.bulkUpload
);

// Tag Members in Photo - Core+ can tag members (Section 7.2)
router.patch(
  '/:docId/tag',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.docIdParam, 'params'),
  validate(v.tagMembersSchema),
  ctrl.tagMembers
);

// Get Document Analytics - Core+ can view analytics (Section 7.2)
router.get(
  '/analytics',
  authenticate,
  requireEither(['admin', 'coordinator'], ['core', 'president']), // Admin/Coordinator OR Club Core+
  validate(v.analyticsSchema, 'query'),
  ctrl.getAnalytics
);

// Search Documents - Members can search (Section 7.2)
router.get(
  '/search',
  authenticate,
  requireEither(['admin', 'coordinator'], ['member', 'core', 'president']), // Admin/Coordinator OR Club Members
  validate(v.searchSchema, 'query'),
  ctrl.searchDocuments
);

// Get Download URL - Members can get download URLs (Section 7.2)
router.get(
  '/:docId/download-url',
  authenticate,
  requireEither(['admin', 'coordinator'], ['member', 'core', 'president']), // Admin/Coordinator OR Club Members
  validate(v.docIdParam, 'params'),
  ctrl.getDownloadUrl
);

module.exports = router;