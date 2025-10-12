const { errorResponse } = require('../utils/response');

module.exports = function error(err, req, res, next) {
  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Determine status code
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle different error types
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.status || err.code) {
    statusCode = err.status || err.code;
    message = err.message || message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = err.details || err.errors;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'MongoError' && err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    details = { field: Object.keys(err.keyPattern)[0] };
  }

  // Log error for debugging (except in test environment)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${new Date().toISOString()}] Error:`, {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      statusCode
    });
  }

  // Send error response using utility
  return errorResponse(res, statusCode, message, details);
};
