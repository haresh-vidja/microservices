/**
 * Error Handling Middleware
 * Provides consistent error handling across the application
 */

const logger = require('../utils/logger');
const { sendError } = require('../utils/response');

/**
 * Async handler wrapper to catch promises
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * MongoDB/Mongoose error handler
 */
const handleMongoError = (err) => {
    let errors = {};

    // Validation errors
    if (err.name === 'ValidationError') {
        Object.keys(err.errors).forEach(field => {
            errors[field] = err.errors[field].message;
        });
        return {
            statusCode: 400,
            message: 'Validation failed',
            errors
        };
    }

    // Duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return {
            statusCode: 400,
            message: `${field} already exists`
        };
    }

    // Cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return {
            statusCode: 400,
            message: 'Invalid ID format'
        };
    }

    return null;
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(`${req.method} ${req.url} - ${error.message}`, {
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Handle specific error types
    const mongoError = handleMongoError(err);
    if (mongoError) {
        return sendError(res, mongoError.message, mongoError.statusCode, mongoError.errors);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return sendError(res, 'Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired', 401);
    }

    // Rate limiting
    if (err.status === 429) {
        return sendError(res, 'Too many requests', 429);
    }

    // Default error
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Internal Server Error';

    sendError(res, message, statusCode);
};

/**
 * 404 handler for undefined routes
 */
const notFound = (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

/**
 * Validation error formatter
 */
const validationError = (errors) => {
    const formattedErrors = {};
    
    errors.forEach(error => {
        formattedErrors[error.param] = error.msg;
    });
    
    return formattedErrors;
};

/**
 * Custom application error class
 */
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    asyncHandler,
    errorHandler,
    notFound,
    validationError,
    AppError
};