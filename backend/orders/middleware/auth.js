/**
 * Authentication Middleware
 * Handles JWT token verification and service key authentication
 */

const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

// Service keys for inter-service communication
const SERVICE_KEYS = {
    ADMIN_KEY: process.env.ADMIN_SERVICE_KEY || 'admin-secret-key-2024',
    CUSTOMER_KEY: process.env.CUSTOMER_SERVICE_KEY || 'customer-secret-key-2024',
    SELLER_KEY: process.env.SELLER_SERVICE_KEY || 'seller-secret-key-2024',
    PRODUCT_KEY: process.env.PRODUCT_SERVICE_KEY || 'product-secret-key-2024',
    MEDIA_KEY: process.env.MEDIA_SERVICE_KEY || 'media-secret-key-2024',
    NOTIFICATION_KEY: process.env.NOTIFICATION_SERVICE_KEY || 'notification-secret-key-2024'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2024';

/**
 * Verify JWT token from Authorization header
 */
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'Access token required', 401);
        }

        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return sendError(res, 'Token expired', 401);
            } else if (jwtError.name === 'JsonWebTokenError') {
                return sendError(res, 'Invalid token', 401);
            } else {
                return sendError(res, 'Token verification failed', 401);
            }
        }
    } catch (error) {
        return sendError(res, 'Authentication error', 500);
    }
};

/**
 * Verify service key for inter-service communication
 */
const verifyServiceKey = (req, res, next) => {
    try {
        const serviceKey = req.headers['x-service-key'];
        
        if (!serviceKey) {
            return sendError(res, 'Service key required', 401);
        }

        // Check if service key is valid
        const validKeys = Object.values(SERVICE_KEYS);
        if (!validKeys.includes(serviceKey)) {
            return sendError(res, 'Invalid service key', 403);
        }

        // Add service info to request
        req.service = {
            authenticated: true,
            key: serviceKey
        };
        
        next();
    } catch (error) {
        return sendError(res, 'Service authentication error', 500);
    }
};

/**
 * Optional token verification (doesn't fail if no token)
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (jwtError) {
            // Continue without user info if token is invalid
            req.user = null;
        }
    }
    
    next();
};

/**
 * Role-based access control
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 'Authentication required', 401);
        }

        if (!roles.includes(req.user.role)) {
            return sendError(res, 'Insufficient permissions', 403);
        }

        next();
    };
};

/**
 * Customer access only
 */
const customerOnly = (req, res, next) => {
    if (!req.user || req.user.type !== 'customer') {
        return sendError(res, 'Customer access required', 403);
    }
    next();
};

/**
 * Service or admin access
 */
const serviceOrAdmin = (req, res, next) => {
    // Check if it's a service request
    if (req.service && req.service.authenticated) {
        return next();
    }
    
    // Check if it's an admin user
    if (req.user && (req.user.role === 'admin' || req.user.type === 'admin')) {
        return next();
    }
    
    return sendError(res, 'Service or admin access required', 403);
};

module.exports = {
    verifyToken,
    verifyServiceKey,
    optionalAuth,
    requireRole,
    customerOnly,
    serviceOrAdmin,
    SERVICE_KEYS
};