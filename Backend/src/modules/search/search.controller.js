// src/modules/search/search.controller.js
const searchService = require('./search.service');
const { successResponse, paginatedResponse } = require('../../utils/response');

/**
 * Global search across all entities
 */
exports.globalSearch = async (req, res, next) => {
  try {
    const results = await searchService.globalSearch(req.query);
    successResponse(res, results, 'Search completed');
  } catch (err) {
    next(err);
  }
};

/**
 * Advanced search with filters
 */
exports.advancedSearch = async (req, res, next) => {
  try {
    const results = await searchService.advancedSearch(req.body);
    successResponse(res, results, 'Advanced search completed');
  } catch (err) {
    next(err);
  }
};

/**
 * Get club recommendations for a user
 */
exports.recommendClubs = async (req, res, next) => {
  try {
    const recommendations = await searchService.recommendClubs(req.user);
    successResponse(res, { recommendations }, 'Club recommendations retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Get user recommendations for a club
 */
exports.recommendUsers = async (req, res, next) => {
  try {
    const recommendations = await searchService.recommendUsers(req.params.clubId);
    successResponse(res, { recommendations }, 'User recommendations retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Get search suggestions
 */
exports.getSuggestions = async (req, res, next) => {
  try {
    const suggestions = await searchService.getSuggestions(req.query.q, req.query.limit);
    successResponse(res, { suggestions }, 'Search suggestions retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Search clubs specifically
 */
exports.searchClubs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const clubs = await searchService.searchClubs(
      req.query.q, 
      req.query, 
      skip, 
      parseInt(limit),
      req.query.sortBy
    );
    
    // Get total count for pagination
    const total = await searchService.getClubCount(req.query.q, req.query);
    
    paginatedResponse(res, clubs, { page: parseInt(page), limit: parseInt(limit), total }, 'Clubs search completed');
  } catch (err) {
    next(err);
  }
};

/**
 * Search events specifically
 */
exports.searchEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const events = await searchService.searchEvents(
      req.query.q, 
      req.query, 
      skip, 
      parseInt(limit),
      req.query.sortBy
    );
    
    const total = await searchService.getEventCount(req.query.q, req.query);
    
    paginatedResponse(res, events, { page: parseInt(page), limit: parseInt(limit), total }, 'Events search completed');
  } catch (err) {
    next(err);
  }
};

/**
 * Search users specifically
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const users = await searchService.searchUsers(
      req.query.q, 
      req.query, 
      skip, 
      parseInt(limit),
      req.query.sortBy
    );
    
    const total = await searchService.getUserCount(req.query.q, req.query);
    
    paginatedResponse(res, users, { page: parseInt(page), limit: parseInt(limit), total }, 'Users search completed');
  } catch (err) {
    next(err);
  }
};

/**
 * Search documents specifically
 */
exports.searchDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const documents = await searchService.searchDocuments(
      req.query.q, 
      req.query, 
      skip, 
      parseInt(limit),
      req.query.sortBy
    );
    
    const total = await searchService.getDocumentCount(req.query.q, req.query);
    
    paginatedResponse(res, documents, { page: parseInt(page), limit: parseInt(limit), total }, 'Documents search completed');
  } catch (err) {
    next(err);
  }
};