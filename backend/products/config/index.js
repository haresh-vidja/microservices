/**
 * Configuration Index
 * Centralized configuration management
 */

module.exports = {
  server: {
    port: process.env.PORT || 3004,
    env: process.env.NODE_ENV || 'development'
  },
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/products_db'
  },
  
  services: {
    media: {
      baseUrl: process.env.MEDIA_SERVICE_URL || 'http://localhost:3003',
      secretKey: process.env.MEDIA_SERVICE_KEY || 'product-secret-key-2024'
    },
    admin: {
      secretKey: process.env.ADMIN_SERVICE_KEY || 'admin-secret-key-2024'
    },
    orders: {
      secretKey: process.env.ORDER_SERVICE_KEY || 'order-secret-key-2024'
    },
    customers: {
      secretKey: process.env.CUSTOMER_SERVICE_KEY || 'customer-secret-key-2024'
    },
    sellers: {
      secretKey: process.env.SELLER_SERVICE_KEY || 'seller-secret-key-2024'
    },
    notifications: {
      secretKey: process.env.NOTIFICATION_SERVICE_KEY || 'notification-secret-key-2024'
    }
  },
  
  inventory: {
    defaultReservationMinutes: 30,
    cleanupIntervalMinutes: 10,
    syncIntervalHours: 1,
    lowStockThreshold: 5
  }
};