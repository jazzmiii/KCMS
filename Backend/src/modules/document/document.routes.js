const router       = require('express').Router({ mergeParams: true });
const authenticate = require('../../middlewares/auth');
const { 
  permit, 
  requireEither,
  CORE_AND_PRESIDENT,  // ✅ All core roles + president
  PRESIDENT_ONLY       // ✅ President only
} = require('../../middlewares/permission');
const validate     = require('../../middlewares/validate');
const { validateUpload } = require('../../middlewares/fileValidator');
const multer       = require('multer');
const upload       = multer({ dest: 'uploads/' });
const v            = require('./document.validators');
const ctrl         = require('./document.controller');

// Middleware: Extract clubId from URL if not in params (mergeParams fallback)
router.use((req, res, next) => {
  console.log('🔍 MIDDLEWARE DEBUG:');
  console.log('  req.baseUrl:', req.baseUrl);
  console.log('  req.originalUrl:', req.originalUrl);
  console.log('  req.params before:', req.params);
  
  if (!req.params.clubId) {
    // Try to extract from baseUrl
    if (req.baseUrl) {
      const match = req.baseUrl.match(/\/clubs\/([a-f0-9]+)/i);
      console.log('  Match result:', match);
      if (match) {
        req.params.clubId = match[1];
        console.log('  ✅ clubId extracted from baseUrl:', req.params.clubId);
      }
    }
    
    // If still not found, try originalUrl
    if (!req.params.clubId && req.originalUrl) {
      const match = req.originalUrl.match(/\/clubs\/([a-f0-9]+)/i);
      console.log('  originalUrl match:', match);
      if (match) {
        req.params.clubId = match[1];
        console.log('  ✅ clubId extracted from originalUrl:', req.params.clubId);
      }
    }
  } else {
    console.log('  ✅ clubId already in params:', req.params.clubId);
  }
  
  console.log('  req.params after:', req.params);
  next();
});

// Upload (single/multiple) - Core+ can upload media (Section 7.1)
router.post(
  '/upload',
  authenticate,
  requireEither(['admin'], CORE_AND_PRESIDENT), // ✅ Admin OR Core+President
  validate(v.clubIdParam, 'params'),
  upload.array('files', 10),
  validateUpload('image'), // Validate file type, size, and security
  validate(v.uploadSchema),
  ctrl.upload
);

// List / Gallery - Public viewing for all authenticated users (Section 7.2)
router.get(
  '/',
  authenticate, // All authenticated users can view gallery
  validate(v.clubIdParam, 'params'),
  validate(v.listSchema, 'query'),
  ctrl.list
);

// Download Original - Public download for all authenticated users (Section 7.2)
router.get(
  '/:docId/download',
  authenticate, // All authenticated users can download
  validate(v.docIdParam, 'params'),
  ctrl.download
);

// Delete Document - Leadership (President & Vice President) can delete (Section 7.2)
router.delete(
  '/:docId',
  authenticate,
  requireEither(['admin'], ['president', 'vicePresident']), // ✅ Admin OR Leadership
  validate(v.docIdParam, 'params'),
  ctrl.delete
);

// Create Album - Core+ can create albums (Section 7.2)
router.post(
  '/albums',
  authenticate,
  requireEither(['admin'], CORE_AND_PRESIDENT), // ✅ Admin OR Core+President
  validate(v.createAlbumSchema),
  ctrl.createAlbum
);

// Get Albums - Public viewing for all authenticated users (Section 7.2)
router.get(
  '/albums',
  authenticate, // All authenticated users can view albums
  ctrl.getAlbums
);

// Bulk Upload - Core+ can bulk upload (Section 7.2)
router.post(
  '/bulk-upload',
  authenticate,
  requireEither(['admin'], CORE_AND_PRESIDENT), // ✅ Admin OR Core+President
  upload.array('files', 10),
  validateUpload('image'), // Validate file type, size, and security
  ctrl.bulkUpload
);

// Tag Members in Photo - Core+ can tag members (Section 7.2)
router.patch(
  '/:docId/tag',
  authenticate,
  requireEither(['admin'], CORE_AND_PRESIDENT), // ✅ Admin OR Core+President
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

// Search Documents - Public search for all authenticated users (Section 7.2)
router.get(
  '/search',
  authenticate, // All authenticated users can search
  validate(v.searchSchema, 'query'),
  ctrl.searchDocuments
);

// Get Download URL - Public download URLs for all authenticated users (Section 7.2)
router.get(
  '/:docId/download-url',
  authenticate, // All authenticated users can get download URLs
  validate(v.docIdParam, 'params'),
  ctrl.getDownloadUrl
);

// Link Existing Photos to Events (Utility/Fix) - Admin/Coordinator or Club Leadership
router.post(
  '/link-to-events',
  authenticate,
  requireEither(['admin', 'coordinator'], ['president', 'vicePresident']), // Admin/Coordinator OR Club Leadership
  ctrl.linkPhotosToEvents
);

// Get Storage Statistics - Leadership can view
router.get(
  '/storage/stats',
  authenticate,
  requireEither(['admin', 'coordinator'], ['president', 'vicePresident']),
  ctrl.getStorageStats
);

// Find Duplicate Images - Leadership only
router.get(
  '/storage/duplicates',
  authenticate,
  requireEither(['admin', 'coordinator'], ['president', 'vicePresident']),
  ctrl.findDuplicates
);

// Get Upload Signature for Direct Upload - Core+ can upload
router.post(
  '/upload/signature',
  authenticate,
  requireEither(['admin'], CORE_AND_PRESIDENT),
  ctrl.getUploadSignature
);

// Add Google Drive Link (bypass 10 photo limit) - Core+ can add
router.post(
  '/drive-link',
  authenticate,
  requireEither(['admin'], CORE_AND_PRESIDENT),
  ctrl.addDriveLink
);

// Get Photo Quota Status - All club members can view
router.get(
  '/quota',
  authenticate,
  ctrl.getPhotoQuota
);

module.exports = router;