// src/modules/recruitment/recruitment.controller.js
const recruitmentService = require('./recruitment.service');
const { successResponse } = require('../../utils/response');

exports.create = async (req, res, next) => {
  try {
    const rec = await recruitmentService.create(req.body, {
      id: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    successResponse(res, { recruitment: rec }, 'Created');
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const rec = await recruitmentService.update(req.params.id, req.body, {
      id: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    successResponse(res, { recruitment: rec }, 'Updated');
  } catch (err) {
    next(err);
  }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const rec = await recruitmentService.changeStatus(req.params.id, req.body.action, {
      id: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    successResponse(res, { recruitment: rec }, 'Status changed');
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const data = await recruitmentService.list(req.query);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const rec = await recruitmentService.getById(req.params.id);
    successResponse(res, { recruitment: rec });
  } catch (err) {
    next(err);
  }
};

exports.apply = async (req, res, next) => {
  try {
    const app = await recruitmentService.apply(
      req.params.id,
      req.user.id,
      req.body.answers,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { application: app }, 'Application submitted');
  } catch (err) {
    next(err);
  }
};

exports.listApplications = async (req, res, next) => {
  try {
    const data = await recruitmentService.listApplications(req.params.id, req.query);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

exports.review = async (req, res, next) => {
  try {
    const app = await recruitmentService.reviewApplication(
      req.params.appId,
      req.body,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { application: app }, 'Application reviewed');
  } catch (err) {
    next(err);
  }
};

exports.bulkReview = async (req, res, next) => {
  try {
    const result = await recruitmentService.bulkReview(
      req.params.id,
      req.body.applicationIds,
      req.body.status,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, result, 'Bulk update done');
  } catch (err) {
    next(err);
  }
};