import api from './api';

const settingsService = {
  // Get all settings
  getSettings: async () => {
    const response = await api.get('/settings');
    // Backend: successResponse(res, { settings }) → { status, data: { settings } }
    return response.data;
  },

  // Get specific settings section
  getSection: async (section) => {
    const response = await api.get(`/settings/${section}`);
    // Backend: successResponse(res, { section, settings }) → { status, data: { section, settings } }
    return response.data;
  },

  // Update all settings
  updateSettings: async (data) => {
    const response = await api.put('/settings', data);
    // Backend: successResponse(res, { settings }, 'Settings updated successfully')
    return response.data;
  },

  // Update specific section
  updateSection: async (section, data) => {
    const response = await api.put(`/settings/${section}`, data);
    // Backend: successResponse(res, { section, oldValue, newValue }, 'Section updated')
    return response.data;
  },

  // Reset settings to defaults
  resetToDefaults: async () => {
    const response = await api.post('/settings/reset');
    // Backend: successResponse(res, { settings }, 'Settings reset to defaults')
    return response.data;
  },

  // Check if feature is enabled
  isFeatureEnabled: async (feature) => {
    const response = await api.get(`/settings/feature/${feature}`);
    // Backend: successResponse(res, { feature, enabled })
    return response.data;
  },

  // Get budget limit for category
  getBudgetLimit: async (category) => {
    const response = await api.get(`/settings/budget-limit/${category}`);
    // Backend: successResponse(res, { category, limit })
    return response.data;
  }
};

export default settingsService;
