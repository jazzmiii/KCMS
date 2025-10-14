const { errorResponse } = require('../utils/response');

module.exports = function error(err, req, res, next) {
  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Handle cases where err is undefined or not an object
  if (!err) {
    console.error('Error middleware received undefined error');
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error - Unknown error occurred'
    });
  }

  // Determine status code
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle different error types
  if (err.statusCode && err.statusCode >= 100 && err.statusCode < 600) {
    // Valid HTTP status code
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.status && err.status >= 100 && err.status < 600) {
    // Valid HTTP status code in .status property
    statusCode = err.status;
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
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    // Handle MongoDB errors
    if (err.code === 11000) {
      statusCode = 409;
      message = 'Duplicate entry';
      details = { field: Object.keys(err.keyPattern || {})[0] };
    } else if (err.code === 27) {
      // IndexNotFound - text index required
      statusCode = 500;
      message = 'Search index not configured';
      details = { mongoError: err.codeName };
    } else {
      statusCode = 500;
      message = err.message || 'Database error';
      details = { mongoError: err.codeName, code: err.code };
    }
  }

  // Log error for debugging (except in test environment)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${new Date().toISOString()}] Error:`, {
      message: err.message || 'No error message',
      stack: err.stack || 'No stack trace',
      type: typeof err,
      errorObject: err,
      url: req.url,
      method: req.method,
      statusCode
    });
  }

  // Send error response using utility
  return errorResponse(res, statusCode, message, details);
};
