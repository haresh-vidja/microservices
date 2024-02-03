/**
 * Response Utility Functions
 * Standardizes API responses across the application
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
const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    // Add timestamp for debugging
    response.timestamp = new Date().toISOString();

    return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
const sendPaginated = (res, data, pagination, message = 'Data retrieved successfully') => {
    return res.json({
        success: true,
        message,
        data,
        pagination
    });
};

/**
 * Send validation error response
 */
const sendValidationError = (res, errors) => {
    return sendError(res, 'Validation failed', 400, errors);
};

/**
 * Send not found response
 */
const sendNotFound = (res, resource = 'Resource') => {
    return sendError(res, `${resource} not found`, 404);
};

/**
 * Send unauthorized response
 */
const sendUnauthorized = (res, message = 'Unauthorized access') => {
    return sendError(res, message, 401);
};

/**
 * Send forbidden response
 */
const sendForbidden = (res, message = 'Forbidden access') => {
    return sendError(res, message, 403);
};

/**
 * Send conflict response
 */
const sendConflict = (res, message = 'Resource conflict') => {
    return sendError(res, message, 409);
};

/**
 * Send too many requests response
 */
const sendTooManyRequests = (res, message = 'Too many requests') => {
    return sendError(res, message, 429);
};

/**
 * Format pagination info
 */
const formatPagination = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    
    return {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
    };
};

/**
 * Format API response with metadata
 */
const formatResponse = (data, meta = {}) => {
    return {
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    };
};

module.exports = {
    sendSuccess,
    sendError,
    sendPaginated,
    sendValidationError,
    sendNotFound,
    sendUnauthorized,
    sendForbidden,
    sendConflict,
    sendTooManyRequests,
    formatPagination,
    formatResponse
};