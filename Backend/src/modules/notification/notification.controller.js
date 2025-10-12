const svc = require('./notification.service');
const { successResponse } = require('../../utils/response');

exports.create = async (req, res, next) => {
  try {
    const notif = await svc.create(req.body);
    successResponse(res, { notification: notif }, 'Notification created');
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const data = await svc.list(req.user.id, req.query);
    successResponse(res, data);
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    const notif = await svc.markRead(req.user.id, req.params.id, req.body.isRead);
    successResponse(res, { notification: notif }, 'Notification updated');
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await svc.markAllRead(req.user.id);
    successResponse(res, null, 'All notifications marked read');
  } catch (err) { next(err); }
};

exports.countUnread = async (req, res, next) => {
  try {
    const count = await svc.countUnread(req.user.id);
    successResponse(res, { count });
  } catch (err) { next(err); }
};