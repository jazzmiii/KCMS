const router       = require('express').Router();
const authenticate = require('../../middlewares/auth');
const optionalAuth = require('../../middlewares/optionalAuth'); // ✅ Optional authentication
const { 
  permit, 
  requireEither, 
  requireAssignedCoordinatorOrClubRoleForEvent,
  CORE_AND_PRESIDENT,  // ✅ All core roles + president
  PRESIDENT_ONLY       // ✅ President only
} = require('../../middlewares/permission');
const validate     = require('../../middlewares/validate');
const parseFormData = require('../../middlewares/parseFormData');
const multer       = require('multer');
const upload       = multer({ dest: 'uploads/' });
const v            = require('./event.validators');
const ctrl         = require('./event.controller');

// Create Event (Core+ can create events - Section 5.1)
router.post(
  '/',
  authenticate,
  upload.fields([
    { name: 'proposal', maxCount: 1 },
    { name: 'budgetBreakdown', maxCount: 1 },
    { name: 'venuePermission', maxCount: 1 }
  ]),
  parseFormData,
  requireEither(['admin'], CORE_AND_PRESIDENT, 'club'), // ✅ Core team + President
  validate(v.createEvent),
  ctrl.createEvent
);

// List Events (Public but with optional authentication for permission filtering - Section 5.1)
// ✅ Uses optionalAuth to extract user info if available, but doesn't require login
router.get(
  '/',
  optionalAuth,
  validate(v.list),
  ctrl.listEvents
);

// Get Event Details (Public - Section 5.1)
router.get(
  '/:id',
  validate(v.eventId, 'params'),
  ctrl.getEvent
);

// Change Status (Core+ OR Assigned Coordinator can change status - Section 5.1)
router.patch(
  '/:id/status',
  authenticate,
  requireAssignedCoordinatorOrClubRoleForEvent(CORE_AND_PRESIDENT), // ✅ Admin OR Assigned Coordinator OR Core+President
  validate(v.eventId, 'params'),
  validate(v.changeStatus),
  ctrl.changeStatus
);

// RSVP (Students can RSVP - Section 2.1)
router.post(
  '/:id/rsvp',
  authenticate,
  validate(v.eventId, 'params'),
  ctrl.rsvp
);

// Mark Attendance (Core+ can mark attendance - Section 5.2)
router.post(
  '/:id/attendance',
  authenticate,
  requireEither(['admin', 'coordinator'], CORE_AND_PRESIDENT), // ✅ Admin/Coordinator OR Core+President
  validate(v.eventId, 'params'),
  validate(v.attendance),
  ctrl.markAttendance
);

// Budget Requests (Core+ can create budget requests - Section 5.3)
router.post(
  '/:id/budget',
  authenticate,
  requireEither(['admin'], CORE_AND_PRESIDENT), // ✅ Admin OR Core+President
  validate(v.eventId, 'params'),
  validate(v.budgetRequest),
  ctrl.createBudget
);

// List Budget Requests (Core+ can view budget requests - Section 5.3)
router.get(
  '/:id/budget',
  authenticate,
  requireEither(['admin'], CORE_AND_PRESIDENT), // ✅ Admin OR Core+President
  validate(v.eventId, 'params'),
  ctrl.listBudgets
);

// Settle Budget (President can settle budget - Section 5.3)
router.post(
  '/:id/budget/settle',
  authenticate,
  requireEither(['admin'], PRESIDENT_ONLY), // ✅ Admin OR President ONLY
  validate(v.eventId, 'params'),
  validate(v.settleBudget),
  ctrl.settleBudget
);

// Coordinator Financial Override (Coordinator can override budget decisions - Section 2.1)
router.post(
  '/:id/financial-override',
  authenticate,
  requireAssignedCoordinatorOrClubRoleForEvent([]), // ✅ Only assigned coordinator (or admin)
  validate(v.eventId, 'params'),
  validate(v.financialOverride),
  ctrl.coordinatorOverrideBudget
);

module.exports = router;