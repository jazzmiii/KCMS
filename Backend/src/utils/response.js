/**
 * Send a successful response with consistent format
 * @param {Object} res - Express response object
 * @param {*} data - Response data (optional)
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
exports.successResponse = (res, data = null, message = 'Success', meta = {}) => {
  const response = {
    status: 'success',
    message,
    ...(data !== null && { data }),
    ...(Object.keys(meta).length > 0 && { meta })
  };
  return res.status(200).json(response);
};

/**
 * Send an error response with consistent format
 * @param {Object} res - Express response object
 * @param {number} code - HTTP status code
 * @param {string} message - Error message
 * @param {*} details - Additional error details (optional)
 */
exports.errorResponse = (res, code = 500, message = 'Internal Server Error', details = null) => {
  const response = {
    status: 'error',
    message,
    ...(details && { details })
  };
  return res.status(code).json(response);
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 */
exports.validationError = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    message: 'Validation failed',
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

/**
 * Send a not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name (e.g., 'User', 'Club')
 */
exports.notFoundError = (res, resource = 'Resource') => {
  return res.status(404).json({
    status: 'error',
    message: `${resource} not found`
  });
};

/**
 * Send an unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message (optional)
 */
exports.unauthorizedError = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    status: 'error',
    message
  });
};

/**
 * Send a forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message (optional)
 */
exports.forbiddenError = (res, message = 'Forbidden') => {
  return res.status(403).json({
    status: 'error',
    message
  });
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info { page, limit, total }
 * @param {string} message - Success message
 */
exports.paginatedResponse = (res, data, pagination, message = 'Success') => {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);
  
  return exports.successResponse(res, data, message, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
};