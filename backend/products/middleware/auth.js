/**
 * Authentication Middleware
 * Service-to-service authentication using shared secrets
 */

const config = require('../config');

/**
 * Verify service key for inter-service communication
 */
const verifyServiceKey = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  
  const validKeys = Object.values(config.services).map(service => service.secretKey);
  
  if (!serviceKey || !validKeys.includes(serviceKey)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing service key'
    });
  }
  
  next();
};

/**
 * Optional authentication - doesn't fail if no key provided
 */
const optionalAuth = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  
  if (serviceKey) {
    const validKeys = Object.values(config.services).map(service => service.secretKey);
    req.isAuthenticated = validKeys.includes(serviceKey);
  } else {
    req.isAuthenticated = false;
  }
  
  next();
};

module.exports = {
  verifyServiceKey,
  optionalAuth
};