/**
 * Response Utilities
 * Standardized API response functions
 */

/**
 * Send success response
 */
const sendSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
const sendError = (res, message = 'Error', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
const sendPaginated = (res, message = 'Success', data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination
  });
};

/**
 * Create pagination object
 */
const createPagination = (page, limit, total) => {
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
  createPagination
};