const { SystemSettings } = require('./settings.model');
const auditService = require('../audit/audit.service');

class SettingsService {
  /**
   * Get system settings (singleton)
   */
  async getSettings() {
    const settings = await SystemSettings.getSingleton();
    return settings;
  }

  /**
   * Get specific settings section
   * @param {string} section - Section name (e.g., 'recruitment', 'events')
   */
  async getSection(section) {
    const settings = await SystemSettings.getSingleton();
    
    if (!settings[section]) {
      const err = new Error(`Settings section '${section}' not found`);
      err.statusCode = 404;
      throw err;
    }
    
    return settings[section];
  }

  /**
   * Update system settings
   * @param {object} updates - Settings updates (can be partial)
   * @param {object} userContext - User performing the update
   */
  async updateSettings(updates, userContext) {
    const oldSettings = await SystemSettings.getSingleton();
    const oldValue = oldSettings.toObject();
    
    // Update settings
    const newSettings = await SystemSettings.updateSingleton(updates, userContext.id);
    
    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'SYSTEM_SETTINGS_UPDATE',
      target: 'SystemSettings',
      oldValue: oldValue,
      newValue: newSettings.toObject(),
      ip: userContext.ip,
      userAgent: userContext.userAgent,
      severity: 'HIGH'
    });
    
    return newSettings;
  }

  /**
   * Update specific settings section
   * @param {string} section - Section name
   * @param {object} updates - Section updates
   * @param {object} userContext - User performing the update
   */
  async updateSection(section, updates, userContext) {
    const settings = await SystemSettings.getSingleton();
    
    if (!settings[section]) {
      const err = new Error(`Settings section '${section}' not found`);
      err.statusCode = 404;
      throw err;
    }
    
    const oldSectionValue = { ...settings[section] };
    
    // Update section
    const fullUpdate = { [section]: updates };
    const newSettings = await this.updateSettings(fullUpdate, userContext);
    
    return {
      section: section,
      oldValue: oldSectionValue,
      newValue: newSettings[section]
    };
  }

  /**
   * Reset settings to defaults
   * @param {object} userContext - User performing the reset
   */
  async resetToDefaults(userContext) {
    const oldSettings = await SystemSettings.getSingleton();
    const oldValue = oldSettings.toObject();
    
    // Delete existing settings
    await SystemSettings.deleteMany({});
    
    // Create new default settings
    const newSettings = await SystemSettings.create({
      lastUpdatedBy: userContext.id,
      lastUpdatedAt: new Date()
    });
    
    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'SYSTEM_SETTINGS_RESET',
      target: 'SystemSettings',
      oldValue: oldValue,
      newValue: newSettings.toObject(),
      ip: userContext.ip,
      userAgent: userContext.userAgent,
      severity: 'CRITICAL'
    });
    
    return newSettings;
  }

  /**
   * Get settings for validation (used by other services)
   * @param {string} type - Settings type (e.g., 'recruitment', 'events')
   */
  async getSettingsFor(type) {
    const settings = await SystemSettings.getSingleton();
    return settings[type] || {};
  }

  /**
   * Check if feature is enabled
   * @param {string} feature - Feature path (e.g., 'recruitment.enabled')
   */
  async isFeatureEnabled(feature) {
    const settings = await SystemSettings.getSingleton();
    const parts = feature.split('.');
    
    let value = settings;
    for (const part of parts) {
      value = value[part];
      if (value === undefined) return false;
    }
    
    return !!value;
  }

  /**
   * Get budget limit for club category
   * @param {string} category - Club category
   */
  async getBudgetLimit(category) {
    const settings = await SystemSettings.getSingleton();
    return settings.events.budgetLimits[category] || settings.events.budgetLimits.default;
  }

  /**
   * Validate file upload
   * @param {string} fileType - 'image', 'document', 'video'
   * @param {number} fileSize - File size in bytes
   * @param {string} extension - File extension
   */
  async validateFileUpload(fileType, fileSize, extension) {
    const settings = await SystemSettings.getSingleton();
    const uploadSettings = settings.fileUploads;
    
    // Check size
    const maxSize = uploadSettings.maxFileSizes[fileType];
    if (fileSize > maxSize) {
      return {
        valid: false,
        error: `File size exceeds limit of ${maxSize / 1024 / 1024}MB`
      };
    }
    
    // Check format
    const allowedFormats = uploadSettings.allowedFormats[fileType];
    if (!allowedFormats.includes(extension.toLowerCase())) {
      return {
        valid: false,
        error: `File format .${extension} not allowed. Allowed: ${allowedFormats.join(', ')}`
      };
    }
    
    return { valid: true };
  }
}

module.exports = new SettingsService();
