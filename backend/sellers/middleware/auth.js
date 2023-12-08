/**
 * Authentication Middleware for Sellers Service
 * Verifies JWT tokens and checks permissions
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const Seller = require('../models/Seller');
const Role = require('../models/Role');
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

    // Check if seller exists and is active
    const seller = await Seller.findById(decoded.id)
      .select('email isActive role')
      .populate('role', 'name permissions level isActive');
    
    if (!seller) {
      return res.status(401).json({
        success: false,
        message: 'Seller not found'
      });
    }

    if (!seller.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    if (!seller.role || !seller.role.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive role'
      });
    }

    // Attach seller info to request
    req.seller = {
      id: decoded.id,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: seller.role,
      permissions: seller.role.permissions
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
 * Check role access middleware
 * @param {String} permission - Required permission
 * @returns {Function} Express middleware function
 */
const checkRoleAccess = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.seller) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!req.seller.permissions) {
        return res.status(403).json({
          success: false,
          message: 'No permissions found'
        });
      }

      // Check if seller has the required permission
      if (!req.seller.permissions[permission]) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${permission}`
        });
      }

      next();
    } catch (error) {
      logger.error('Role access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Check multiple permissions (any one is sufficient)
 * @param {Array} permissions - Array of required permissions
 * @returns {Function} Express middleware function
 */
const checkAnyPermission = (permissions) => {
  return (req, res, next) => {
    try {
      if (!req.seller) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!req.seller.permissions) {
        return res.status(403).json({
          success: false,
          message: 'No permissions found'
        });
      }

      // Check if seller has any of the required permissions
      const hasPermission = permissions.some(permission => 
        req.seller.permissions[permission]
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required any of: ${permissions.join(', ')}`
        });
      }

      next();
    } catch (error) {
      logger.error('Multiple permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Check role level middleware
 * @param {Number} minimumLevel - Minimum required role level
 * @returns {Function} Express middleware function
 */
const checkRoleLevel = (minimumLevel) => {
  return (req, res, next) => {
    try {
      if (!req.seller) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!req.seller.role) {
        return res.status(403).json({
          success: false,
          message: 'No role found'
        });
      }

      if (req.seller.role.level < minimumLevel) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Minimum role level required: ${minimumLevel}`
        });
      }

      next();
    } catch (error) {
      logger.error('Role level check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role level check failed'
      });
    }
  };
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
      
      const seller = await Seller.findById(decoded.id)
        .select('email isActive role')
        .populate('role', 'name permissions level isActive');
      
      if (seller && seller.isActive && seller.role && seller.role.isActive) {
        req.seller = {
          id: decoded.id,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          role: seller.role,
          permissions: seller.role.permissions
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

module.exports = {
  verifyToken,
  checkRoleAccess,
  checkAnyPermission,
  checkRoleLevel,
  optionalAuth
};