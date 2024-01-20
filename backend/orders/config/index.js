/**
 * Orders Service Configuration
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
    port: process.env.PORT || 3005,
    host: process.env.HOST || 'localhost'
  },
  
  // Database configuration (Orders specific database)
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/orders_db',
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
    db: process.env.REDIS_DB || 5
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'orders-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Inter-service communication
  services: {
    customer: {
      baseUrl: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3001',
      secretKey: process.env.CUSTOMER_SECRET_KEY || 'shared-secret-customer'
    },
    sellers: {
      baseUrl: process.env.SELLERS_SERVICE_URL || 'http://localhost:3002',
      secretKey: process.env.SELLERS_SECRET_KEY || 'shared-secret-sellers'
    },
    products: {
      baseUrl: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3004',
      secretKey: process.env.PRODUCTS_SECRET_KEY || 'shared-secret-products'
    },
    media: {
      baseUrl: process.env.MEDIA_SERVICE_URL || 'http://localhost:3003',
      secretKey: process.env.MEDIA_SECRET_KEY || 'shared-secret-media'
    }
  },
  
  // Kafka configuration
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'orders-service',
    groupId: process.env.KAFKA_GROUP_ID || 'orders-group'
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
  serviceName: 'orders-service'
};

module.exports = config;