// src/modules/user/user.controller.js

const userService = require('./user.service');
const { successResponse } = require('../../utils/response');

exports.getMe = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.id);
    successResponse(res, { user });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(
      req.user.id,
      req.body,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { user }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(
      req.user.id,
      req.body.oldPassword,
      req.body.newPassword,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, null, 'Password changed, please log in again');
  } catch (err) {
    next(err);
  }
};

exports.uploadPhoto = async (req, res, next) => {
  try {
    const result = await userService.uploadPhoto(
      req.user.id,
      req.file,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, result, 'Profile photo updated');
  } catch (err) {
    next(err);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const prefs = await userService.updatePreferences(
      req.user.id,
      req.body,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { preferences: prefs }, 'Preferences updated');
  } catch (err) {
    next(err);
  }
};

exports.listSessions = async (req, res, next) => {
  try {
    const sessions = await userService.listSessions(req.user.id);
    successResponse(res, { sessions });
  } catch (err) {
    next(err);
  }
};

exports.revokeSession = async (req, res, next) => {
  try {
    await userService.revokeSession(
      req.user.id,
      req.params.sessionId,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, null, 'Session revoked');
  } catch (err) {
    next(err);
  }
};

exports.getMyClubs = async (req, res, next) => {
  try {
    const clubs = await userService.getMyClubs(req.user.id, req.query.role);
    successResponse(res, { clubs });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    // Pass user context so service can filter based on permissions
    const data = await userService.listUsers(filters, page, limit, req.user);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    successResponse(res, { user });
  } catch (err) {
    next(err);
  }
};

exports.updateUserById = async (req, res, next) => {
  try {
    const user = await userService.updateUserById(
      req.params.id,
      req.body,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { user }, 'User updated');
  } catch (err) {
    next(err);
  }
};

exports.changeUserRole = async (req, res, next) => {
  try {
    const { user, oldRole } = await userService.changeGlobalRole(
      req.params.id,
      req.body.global,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { user }, 'User role updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await userService.deleteUser(
      req.params.id,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, deletedUser, 'User permanently deleted from database');
  } catch (err) {
    next(err);
  }
};