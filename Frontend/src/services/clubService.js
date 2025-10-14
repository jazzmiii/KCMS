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

  // Approve Protected Settings (Coordinator only)
  approveSettings: async (clubId, approvalData) => {
    const response = await api.post(`/clubs/${clubId}/settings/approve`, approvalData);
    return response.data;
  },

  // Archive Club
  archiveClub: async (clubId) => {
    const response = await api.delete(`/clubs/${clubId}`);
    return response.data;
  },

  // Get Club Analytics
  getAnalytics: async (clubId, params = {}) => {
    const response = await api.get(`/clubs/${clubId}/analytics`, { params });
    return response.data;
  },

  // Upload Club Banner
  uploadBanner: async (clubId, file) => {
    const formData = new FormData();
    formData.append('banner', file);
    const response = await api.post(`/clubs/${clubId}/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get Club Members
  getMembers: async (clubId, params = {}) => {
    const response = await api.get(`/clubs/${clubId}/members`, { params });
    return response.data;
  },

  // Add Member to Club
  addMember: async (clubId, data) => {
    const response = await api.post(`/clubs/${clubId}/members`, data);
    return response.data;
  },

  // Update Member Role
  updateMemberRole: async (clubId, memberId, data) => {
    const response = await api.patch(`/clubs/${clubId}/members/${memberId}`, data);
    return response.data;
  },

  // Remove Member from Club
  removeMember: async (clubId, memberId) => {
    const response = await api.delete(`/clubs/${clubId}/members/${memberId}`);
    return response.data;
  },
};

export default clubService;
