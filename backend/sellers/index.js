/**
 * Sellers Service Entry Point
 * Starts the Express server and connects to database
 */

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const sellerService = require('./services/sellerService');
const gracefulShutdown = require('http-graceful-shutdown');

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Database connected successfully');

    // Initialize default roles
    await sellerService.initializeRoles();

    // Start Express server
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`Sellers Service running on http://${config.server.host}:${config.server.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API Documentation: http://${config.server.host}:${config.server.port}/api-docs`);
    });

    // Enable graceful shutdown
    gracefulShutdown(server, {
      signals: 'SIGINT SIGTERM',
      timeout: 30000,
      development: config.env === 'development',
      onShutdown: async () => {
        logger.info('Server is shutting down...');
      },
      finally: () => {
        logger.info('Server shutdown complete');
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();