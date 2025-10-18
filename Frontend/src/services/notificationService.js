import api from './api';

const notificationService = {
  // List Notifications
  list: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  // Mark as Read
  markRead: async (id, isRead = true) => {
    const response = await api.patch(`/notifications/${id}/read`, { isRead });
    return response.data;
  },

  // Mark All as Read
  markAllRead: async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },

  // Get Unread Count
  countUnread: async () => {
    const response = await api.get('/notifications/count-unread');
    return response.data;
  },

  // Email Unsubscribe Methods (NEW - Backend Gap Implementation)
  // Get unsubscribe preferences (no auth - uses token)
  getUnsubscribePreferences: async (token) => {
    const response = await api.get(`/notifications/unsubscribe/${token}`);
    return response.data;
  },

  // Unsubscribe from specific notification type
  unsubscribeFromType: async (token, type) => {
    const response = await api.post(`/notifications/unsubscribe/${token}/type`, { type });
    return response.data;
  },

  // Unsubscribe from all non-urgent notifications
  unsubscribeAll: async (token) => {
    const response = await api.post(`/notifications/unsubscribe/${token}/all`);
    return response.data;
  },

  // Resubscribe to a notification type
  resubscribe: async (token, type) => {
    const response = await api.post(`/notifications/unsubscribe/${token}/resubscribe`, { type });
    return response.data;
  },

  // Update notification preferences
  updateUnsubscribePreferences: async (token, preferences) => {
    const response = await api.put(`/notifications/unsubscribe/${token}/preferences`, { preferences });
    return response.data;
  },

  // Admin: Create notification (Admin only)
  createNotification: async (data) => {
    const response = await api.post('/notifications', data);
    return response.data;
  },
};

export default notificationService;
