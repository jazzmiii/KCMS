import api from './api';

const eventService = {
  // Create Event
  create: async (formData) => {
    const response = await api.post('/events', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // List Events
  list: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  // Get Event Details
  getById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Change Status
  // action: 'submit' | 'approve' | 'reject' | 'publish' | 'start' | 'complete'
  // extraData: { reason } - required for 'reject' action
  changeStatus: async (id, action, extraData = {}) => {
    const response = await api.patch(`/events/${id}/status`, { action, ...extraData });
    return response.data;
  },

  // RSVP
  rsvp: async (id) => {
    const response = await api.post(`/events/${id}/rsvp`);
    return response.data;
  },

  // Mark Attendance
  markAttendance: async (id, data) => {
    const response = await api.post(`/events/${id}/attendance`, data);
    return response.data;
  },

  // Create Budget Request
  createBudget: async (id, data) => {
    const response = await api.post(`/events/${id}/budget`, data);
    return response.data;
  },

  // List Budgets
  listBudgets: async (id) => {
    const response = await api.get(`/events/${id}/budget`);
    return response.data;
  },

  // Settle Budget
  settleBudget: async (id, data) => {
    const response = await api.post(`/events/${id}/budget/settle`, data);
    return response.data;
  },

  // NOTE: Budget approval is handled via BudgetRequest status updates in Backend
  // There is no separate endpoint for approveBudget - removed as it called non-existent route

  // NOTE: Post-event report submission endpoint doesn't exist in Backend
  // Removed submitReport() method - endpoint needs to be implemented in Backend first
};

export default eventService;
