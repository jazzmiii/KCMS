const svc = require('./audit.service');
const { successResponse } = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const data = await svc.list(req.query);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};