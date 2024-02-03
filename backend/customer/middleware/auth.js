/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

/**
 * Verify JWT token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    // Check if bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>'
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if customer exists and is active
    const customer = await Customer.findById(decoded.id).select('email isActive');
    
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (!customer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach customer info to request
    req.customer = {
      id: decoded.id,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    };

    next();
  } catch (error) {
    logger.error('Token verification error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Doesn't fail if no token provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      const customer = await Customer.findById(decoded.id).select('email isActive');
      
      if (customer && customer.isActive) {
        req.customer = {
          id: decoded.id,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName
        };
      }
    } catch (error) {
      // Token invalid, but continue without auth
      logger.debug('Optional auth token invalid:', error.message);
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

// Service keys for inter-service communication
const SERVICE_KEYS = {
  ADMIN_KEY: process.env.ADMIN_SERVICE_KEY || 'admin-secret-key-2024',
  ORDER_KEY: process.env.ORDER_SERVICE_KEY || 'order-secret-key-2024',
  SELLER_KEY: process.env.SELLER_SERVICE_KEY || 'seller-secret-key-2024',
  PRODUCT_KEY: process.env.PRODUCT_SERVICE_KEY || 'product-secret-key-2024',
  MEDIA_KEY: process.env.MEDIA_SERVICE_KEY || 'media-secret-key-2024',
  NOTIFICATION_KEY: process.env.NOTIFICATION_SERVICE_KEY || 'notification-secret-key-2024'
};

/**
 * Verify service key for inter-service communication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyServiceKey = (req, res, next) => {
  try {
    const serviceKey = req.headers['x-service-key'];
    
    if (!serviceKey) {
      return res.status(401).json({
        success: false,
        message: 'Service key required'
      });
    }

    // Check if service key is valid
    const validKeys = Object.values(SERVICE_KEYS);
    if (!validKeys.includes(serviceKey)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid service key'
      });
    }

    // Add service info to request
    req.service = {
      authenticated: true,
      key: serviceKey
    };
    
    next();
  } catch (error) {
    logger.error('Service authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Service authentication error'
    });
  }
};

module.exports = {
  verifyToken,
  optionalAuth,
  verifyServiceKey
};