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
};

export default notificationService;
