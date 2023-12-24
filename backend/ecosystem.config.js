/**
 * PM2 Ecosystem Configuration
 * Manages all microservices with PM2
 */

module.exports = {
  apps: [
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
      script: './media/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
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
    }
  ]
};