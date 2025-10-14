import api from './api';

const searchService = {
  // Global search (no auth required for public search)
  globalSearch: async (query, params = {}) => {
    const response = await api.get('/search', {
      params: { q: query, ...params }
    });
    return response.data;
  },

  // Advanced search (authenticated)
  advancedSearch: async (searchCriteria) => {
    const response = await api.post('/search/advanced', searchCriteria);
    return response.data;
  },

  // Get search suggestions (autocomplete)
  getSuggestions: async (query, params = {}) => {
    const response = await api.get('/search/suggestions', {
      params: { q: query, ...params }
    });
    return response.data;
  },

  // Get club recommendations for authenticated user
  getClubRecommendations: async () => {
    const response = await api.get('/search/recommendations/clubs');
    return response.data;
  },

  // Get user recommendations for a club (club core members only)
  getUserRecommendations: async (clubId) => {
    const response = await api.get(`/search/recommendations/users/${clubId}`);
    return response.data;
  },

  // Search clubs specifically
  searchClubs: async (params = {}) => {
    const response = await api.get('/search/clubs', { params });
    return response.data;
  },

  // Search events specifically
  searchEvents: async (params = {}) => {
    const response = await api.get('/search/events', { params });
    return response.data;
  },

  // Search users specifically (authenticated)
  searchUsers: async (params = {}) => {
    const response = await api.get('/search/users', { params });
    return response.data;
  },

  // Search documents specifically (authenticated)
  searchDocuments: async (params = {}) => {
    const response = await api.get('/search/documents', { params });
    return response.data;
  },
};

export default searchService;
