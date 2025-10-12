const router = require('express').Router();
const controller = require('./health.controller');

// Liveness: process is running
router.get('/live', controller.live);

// Readiness: dependencies (Mongo, Redis) are ready
router.get('/ready', controller.ready);

module.exports = router;
