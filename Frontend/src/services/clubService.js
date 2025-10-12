import api from './api';

const clubService = {
  // Create Club (Admin only)
  createClub: async (formData) => {
    const response = await api.post('/clubs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // List Clubs
  listClubs: async (params = {}) => {
    const response = await api.get('/clubs', { params });
    return response.data;
  },

  // Get Club Details
  getClub: async (clubId) => {
    const response = await api.get(`/clubs/${clubId}`);
    return response.data;
  },

  // Update Club Settings
  updateSettings: async (clubId, data) => {
    const response = await api.patch(`/clubs/${clubId}/settings`, data);
    return response.data;
  },

  // Approve Club
  approveClub: async (clubId, data) => {
    const response = await api.patch(`/clubs/${clubId}/approve`, data);
    return response.data;
  },

  // Archive Club
  archiveClub: async (clubId) => {
    const response = await api.delete(`/clubs/${clubId}`);
    return response.data;
  },
};

export default clubService;
