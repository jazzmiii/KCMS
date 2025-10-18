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

// Push Notification Controllers
const { PushSubscription } = require('./pushSubscription.model');
const { getVapidPublicKey, sendPushToUser, isPushAvailable } = require('../../utils/pushNotification');
const { parseUserAgent } = require('../../utils/deviceFingerprint');

exports.getVapidKey = async (req, res, next) => {
  try {
    const publicKey = getVapidPublicKey();
    
    if (!publicKey) {
      return successResponse(res, { 
        available: false, 
        message: 'Push notifications not configured' 
      });
    }
    
    successResponse(res, { 
      available: true, 
      publicKey 
    });
  } catch (err) { next(err); }
};

exports.subscribePush = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    const deviceInfo = parseUserAgent(req.headers['user-agent']);
    
    // Check if subscription already exists
    const existing = await PushSubscription.findOne({
      'subscription.endpoint': subscription.endpoint
    });
    
    if (existing) {
      // Update existing subscription
      existing.user = req.user.id;
      existing.subscription = subscription;
      existing.deviceInfo = deviceInfo;
      existing.active = true;
      existing.lastUsed = new Date();
      await existing.save();
      
      return successResponse(res, { subscription: existing }, 'Push subscription updated');
    }
    
    // Create new subscription
    const newSubscription = await PushSubscription.create({
      user: req.user.id,
      subscription,
      deviceInfo,
      active: true,
      lastUsed: new Date()
    });
    
    successResponse(res, { subscription: newSubscription }, 'Subscribed to push notifications');
  } catch (err) { next(err); }
};

exports.unsubscribePush = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    
    await PushSubscription.findOneAndUpdate(
      { 
        user: req.user.id,
        'subscription.endpoint': endpoint
      },
      { active: false }
    );
    
    successResponse(res, null, 'Unsubscribed from push notifications');
  } catch (err) { next(err); }
};

exports.listPushSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await PushSubscription.find({
      user: req.user.id,
      active: true
    }).select('-subscription.keys');
    
    successResponse(res, { subscriptions });
  } catch (err) { next(err); }
};

exports.testPush = async (req, res, next) => {
  try {
    if (!isPushAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Push notifications not available'
      });
    }
    
    const result = await sendPushToUser(req.user.id, {
      title: 'Test Notification',
      body: 'This is a test push notification from KMIT Clubs Hub',
      icon: '/icons/test.png',
      tag: 'test',
      data: { test: true }
    });
    
    successResponse(res, result, 'Test push notification sent');
  } catch (err) { next(err); }
};