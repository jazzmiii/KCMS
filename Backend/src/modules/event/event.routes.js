const router       = require('express').Router();
const authenticate = require('../../middlewares/auth');
const { permit, requireEither } = require('../../middlewares/permission');
const validate     = require('../../middlewares/validate');
const multer       = require('multer');
const upload       = multer({ dest: 'uploads/' });
const v            = require('./event.validators');
const ctrl         = require('./event.controller');

// Create Event (Core+ can create events - Section 5.1)
router.post(
  '/',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  upload.fields([
    { name: 'proposal', maxCount: 1 },
    { name: 'budgetBreakdown', maxCount: 1 },
    { name: 'venuePermission', maxCount: 1 }
  ]),
  validate(v.createEvent),
  ctrl.createEvent
);

// List Events (Public - Section 5.1)
router.get(
  '/',
  validate(v.list),
  ctrl.listEvents
);

// Get Event Details (Public - Section 5.1)
router.get(
  '/:id',
  validate(v.eventId, 'params'),
  ctrl.getEvent
);

// Change Status (Core+ can change status - Section 5.1)
router.patch(
  '/:id/status',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
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
  requireEither(['admin', 'coordinator'], ['core', 'president']), // Admin/Coordinator OR Club Core+
  validate(v.eventId, 'params'),
  validate(v.attendance),
  ctrl.markAttendance
);

// Budget Requests (Core+ can create budget requests - Section 5.3)
router.post(
  '/:id/budget',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.eventId, 'params'),
  validate(v.budgetRequest),
  ctrl.createBudget
);

// List Budget Requests (Core+ can view budget requests - Section 5.3)
router.get(
  '/:id/budget',
  authenticate,
  requireEither(['admin'], ['core', 'president']), // Admin OR Club Core+
  validate(v.eventId, 'params'),
  ctrl.listBudgets
);

// Settle Budget (President can settle budget - Section 5.3)
router.post(
  '/:id/budget/settle',
  authenticate,
  requireEither(['admin'], ['president']), // Admin OR Club President
  validate(v.eventId, 'params'),
  validate(v.settleBudget),
  ctrl.settleBudget
);

module.exports = router;