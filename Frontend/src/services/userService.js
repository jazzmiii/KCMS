import api from './api';

const userService = {
  // Get Current User Profile
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Update Current User Profile
  updateMe: async (data) => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  // Change Password
  changePassword: async (data) => {
    const response = await api.put('/users/me/password', data);
    return response.data;
  },

  // Get My Clubs
  getMyClubs: async (roleFilter) => {
    const params = roleFilter ? { role: roleFilter } : {};
    const response = await api.get('/users/me/clubs', { params });
    return response.data;
  },

  // List Users (Admin only)
  listUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get User By ID (Admin only)
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update User (Admin only)
  updateUser: async (id, data) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  // Change User Role (Admin only)
  changeUserRole: async (id, data) => {
    const response = await api.patch(`/users/${id}/role`, data);
    return response.data;
  },

  // Delete User (Admin only)
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Upload Profile Photo
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post('/users/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update Notification Preferences
  updatePreferences: async (preferences) => {
    const response = await api.patch('/users/me/preferences', preferences);
    return response.data;
  },

  // List Active Sessions
  listSessions: async () => {
    const response = await api.get('/users/me/sessions');
    return response.data;
  },

  // Revoke Session
  revokeSession: async (sessionId) => {
    const response = await api.delete(`/users/me/sessions/${sessionId}`);
    return response.data;
  },
};

export default userService;
