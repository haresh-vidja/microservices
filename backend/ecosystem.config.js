/**
 * PM2 Ecosystem Configuration
 * Manages all microservices with PM2
 */

module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './api-gateway/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 8000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      error_file: './logs/gateway-error.log',
      out_file: './logs/gateway-out.log',
      log_file: './logs/gateway.log',
      time: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'customer-service',
      script: './customer/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/customer-error.log',
      out_file: './logs/customer-out.log',
      log_file: './logs/customer.log',
      time: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'sellers-service',
      script: './sellers/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/sellers-error.log',
      out_file: './logs/sellers-out.log',
      log_file: './logs/sellers.log',
      time: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'media-service',
      script: 'php -S localhost:3003 -t ./media/',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 3003
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      error_file: './logs/media-error.log',
      out_file: './logs/media-out.log',
      log_file: './logs/media.log',
      time: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'products-service',
      script: './products/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3004
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      error_file: './logs/products-error.log',
      out_file: './logs/products-out.log',
      log_file: './logs/products.log',
      time: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'orders-service',
      script: './orders/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3005
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      error_file: './logs/orders-error.log',
      out_file: './logs/orders-out.log',
      log_file: './logs/orders.log',
      time: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'admin-service',
      script: './admin/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3006
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_file: './logs/admin.log',
      time: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'notifications-service',
      script: 'php -S localhost:3007 -t ./notifications/',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 3007
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3007
      },
      error_file: './logs/notifications-error.log',
      out_file: './logs/notifications-out.log',
      log_file: './logs/notifications.log',
      time: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000
    }
  ]
};