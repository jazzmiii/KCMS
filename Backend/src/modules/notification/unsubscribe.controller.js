/**
 * Unsubscribe Controller
 * Handles email unsubscribe requests
 * Workplan Line 368: Unsubscribe link (except URGENT)
 */

const { Unsubscribe } = require('./unsubscribe.model');
const { User } = require('../auth/user.model');
const { successResponse } = require('../../utils/response');

/**
 * Get unsubscribe preferences for a user
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const prefs = await Unsubscribe.findOne({ unsubscribeToken: token })
      .populate('user', 'profile.name email');
    
    if (!prefs) {
      return res.status(404).json({ message: 'Unsubscribe preferences not found' });
    }
    
    successResponse(res, prefs, 'Unsubscribe preferences retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Unsubscribe from a specific notification type
 */
exports.unsubscribeFromType = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { type } = req.body;
    
    const prefs = await Unsubscribe.findOne({ unsubscribeToken: token });
    
    if (!prefs) {
      return res.status(404).json({ message: 'Unsubscribe preferences not found' });
    }
    
    // Update preference for specific type
    if (prefs.preferences[type] !== undefined) {
      prefs.preferences[type] = false;
      await prefs.save();
      
      successResponse(res, { type, unsubscribed: true }, `Successfully unsubscribed from ${type} notifications`);
    } else {
      return res.status(400).json({ message: 'Invalid notification type' });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Unsubscribe from all non-urgent notifications
 */
exports.unsubscribeAll = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const prefs = await Unsubscribe.findOne({ unsubscribeToken: token });
    
    if (!prefs) {
      return res.status(404).json({ message: 'Unsubscribe preferences not found' });
    }
    
    // Unsubscribe from all types except URGENT ones
    prefs.preferences.recruitment_open = false;
    prefs.preferences.recruitment_closing = false;
    prefs.preferences.application_status = false;
    prefs.preferences.event_reminder = false;
    prefs.preferences.role_assigned = false;
    
    // Note: approval_required and system_maintenance (if URGENT) cannot be unsubscribed
    prefs.unsubscribedAll = true;
    prefs.unsubscribedAt = new Date();
    
    await prefs.save();
    
    successResponse(res, { unsubscribedAll: true }, 'Successfully unsubscribed from all non-urgent notifications');
  } catch (err) {
    next(err);
  }
};

/**
 * Resubscribe to a specific notification type
 */
exports.resubscribeToType = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { type } = req.body;
    
    const prefs = await Unsubscribe.findOne({ unsubscribeToken: token });
    
    if (!prefs) {
      return res.status(404).json({ message: 'Unsubscribe preferences not found' });
    }
    
    // Update preference for specific type
    if (prefs.preferences[type] !== undefined) {
      prefs.preferences[type] = true;
      
      // If resubscribing to any type, reset unsubscribedAll flag
      if (prefs.unsubscribedAll) {
        prefs.unsubscribedAll = false;
        prefs.unsubscribedAt = null;
      }
      
      await prefs.save();
      
      successResponse(res, { type, subscribed: true }, `Successfully resubscribed to ${type} notifications`);
    } else {
      return res.status(400).json({ message: 'Invalid notification type' });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Update multiple notification preferences at once
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { preferences } = req.body;
    
    const prefs = await Unsubscribe.findOne({ unsubscribeToken: token });
    
    if (!prefs) {
      return res.status(404).json({ message: 'Unsubscribe preferences not found' });
    }
    
    // Update each preference
    Object.keys(preferences).forEach(key => {
      if (prefs.preferences[key] !== undefined) {
        prefs.preferences[key] = preferences[key];
      }
    });
    
    await prefs.save();
    
    successResponse(res, prefs.preferences, 'Preferences updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = exports;
