/**
 * Customer Service Configuration
 * Loads environment variables and exports configuration
 */

require('dotenv').config();

/**
 * Service configuration object
 */
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  
  // Server configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost'
  },
  
  // Database configuration (Customer specific database)
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/customer_db',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    }
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 1
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'customer-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs'
  },
  
  // API versioning
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: process.env.API_PREFIX || '/api/v1'
  },
  
  // Service name
  serviceName: 'customer-service'
};

module.exports = config;