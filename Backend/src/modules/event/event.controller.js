// src/modules/event/event.controller.js
const svc = require('./event.service');
const { successResponse } = require('../../utils/response');

/**
 * Create Event
 */
exports.createEvent = async (req, res, next) => {
  try {
    const event = await svc.create(
      req.body,
      req.files,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { event }, 'Event created');
  } catch (err) {
    next(err);
  }
};

/**
 * List Events
 */
exports.listEvents = async (req, res, next) => {
  try {
    // Pass user context for permission filtering
    const userContext = req.user ? {
      id: req.user.id,
      roles: req.user.roles,
      memberships: req.user.memberships || []
    } : null;
    
    const data = await svc.list(req.query, userContext);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

/**
 * Get Event Details (includes canManage flag)
 */
exports.getEvent = async (req, res, next) => {
  try {
    const event = await svc.getById(req.params.id, req.user); // ✅ Pass user context
    successResponse(res, { event });
  } catch (err) {
    next(err);
  }
};

/**
 * Change Status
 */
exports.changeStatus = async (req, res, next) => {
  try {
    const event = await svc.changeStatus(
      req.params.id,
      req.body.action,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { event }, 'Status changed');
  } catch (err) {
    next(err);
  }
};

/**
 * RSVP
 */
exports.rsvp = async (req, res, next) => {
  try {
    await svc.rsvp(
      req.params.id,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, null, 'RSVP recorded');
  } catch (err) {
    next(err);
  }
};

/**
 * Mark Attendance
 */
exports.markAttendance = async (req, res, next) => {
  try {
    await svc.markAttendance(
      req.params.id,
      { userId: req.body.userId },
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, null, 'Attendance marked');
  } catch (err) {
    next(err);
  }
};

/**
 * Create Budget Request
 */
exports.createBudget = async (req, res, next) => {
  try {
    const br = await svc.createBudget(
      req.params.id,
      req.body,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { budgetRequest: br }, 'Budget requested');
  } catch (err) {
    next(err);
  }
};

/**
 * List Budget Requests
 */
exports.listBudgets = async (req, res, next) => {
  try {
    const items = await svc.listBudgets(req.params.id);
    successResponse(res, { items });
  } catch (err) {
    next(err);
  }
};

/**
 * Settle Budget
 */
exports.settleBudget = async (req, res, next) => {
  try {
    const br = await svc.settleBudget(
      req.params.id,
      req.body,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { budgetRequest: br }, 'Budget settled');
  } catch (err) {
    next(err);
  }
};

/**
 * Coordinator Financial Override
 * Allows coordinator to reject/reduce budget with reason
 */
exports.coordinatorOverrideBudget = async (req, res, next) => {
  try {
    const event = await svc.coordinatorOverrideBudget(
      req.params.id,
      req.body,
      { 
        id: req.user.id, 
        name: req.user.profile?.name,
        ip: req.ip, 
        userAgent: req.headers['user-agent'] 
      }
    );
    successResponse(res, { event }, 'Financial override applied');
  } catch (err) {
    next(err);
  }
};