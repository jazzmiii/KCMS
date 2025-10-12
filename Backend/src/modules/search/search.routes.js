// src/modules/search/search.routes.js
const router = require('express').Router();
const authenticate = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const v = require('./search.validators');
const ctrl = require('./search.controller');

// Global search (no auth required for public search)
router.get(
  '/',
  validate(v.globalSearchSchema, 'query'),
  ctrl.globalSearch
);

// Advanced search (authenticated)
router.post(
  '/advanced',
  authenticate,
  validate(v.advancedSearchSchema),
  ctrl.advancedSearch
);

// Get search suggestions
router.get(
  '/suggestions',
  validate(v.suggestionsSchema, 'query'),
  ctrl.getSuggestions
);

// Club recommendations for authenticated user
router.get(
  '/recommendations/clubs',
  authenticate,
  ctrl.recommendClubs
);

// User recommendations for a club (club core members only)
router.get(
  '/recommendations/users/:clubId',
  authenticate,
  validate(v.clubId, 'params'),
  ctrl.recommendUsers
);

// Specific entity searches
router.get(
  '/clubs',
  validate(v.clubSearchSchema, 'query'),
  ctrl.searchClubs
);

router.get(
  '/events',
  validate(v.eventSearchSchema, 'query'),
  ctrl.searchEvents
);

router.get(
  '/users',
  authenticate,
  validate(v.userSearchSchema, 'query'),
  ctrl.searchUsers
);

router.get(
  '/documents',
  authenticate,
  validate(v.documentSearchSchema, 'query'),
  ctrl.searchDocuments
);

module.exports = router;