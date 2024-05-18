/**
 * Products Service Entry Point
 * 
 * @fileoverview Modular products catalog and inventory management service
 * @description This service handles product catalog management, inventory tracking,
 * and provides RESTful APIs for product operations. It includes scheduled tasks
 * for inventory management and integrates with other microservices.
 * 
 * @author Haresh Vidja
 * @version 1.0.0
 * @since 2023-11-01
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const { connectDB } = require('./config/database');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const scheduler = require('./utils/scheduler');

/**
 * Express application instance
 * @type {express.Application}
 */
const app = express();

/**
 * Server port configuration
 * @type {number}
 */
const PORT = config.server.port;

/**
 * Security and performance middleware configuration
 * @description Applies security headers, CORS policy, compression, and request parsing
 */
app.use(helmet()); // Security headers
app.use(cors({ origin: '*', credentials: true })); // CORS configuration
app.use(compression()); // Response compression
app.use(express.json({ limit: '10mb' })); // JSON body parser with size limit
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser

/**
 * Swagger API documentation configuration
 * @description Generates interactive API documentation using OpenAPI 3.0 specification
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Products Service API',
      version: '1.0.0',
      description: 'Product catalog and inventory management API',
      contact: {
        name: 'Haresh Vidja',
        email: 'hareshvidja@gmail.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        serviceKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Service-Key',
          description: 'Service-to-service authentication key'
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js'] // API documentation sources
};

/**
 * Swagger specification instance
 * @type {Object}
 */
const specs = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI for interactive API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Provide Swagger specification as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

/**
 * API Routes Configuration
 * @description Mounts all product-related API endpoints
 */
app.use('/api', routes);

/**
 * Global Error Handling Middleware
 * @description Catches and processes all unhandled errors
 */
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

/**
 * Graceful shutdown handler
 * @description Ensures clean shutdown of the service and all resources
 * @param {string} signal - The shutdown signal received
 * @returns {Promise<void>}
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);
  
  try {
    // Stop scheduled tasks and background jobs
    scheduler.shutdown();
    console.log('✅ Scheduler stopped');
    
    // Close database connection gracefully
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

/**
 * Process Signal Handlers
 * @description Handles various shutdown signals for graceful termination
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Docker/Kubernetes shutdown
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C termination

/**
 * Global Error Handlers
 * @description Catches unhandled errors and promise rejections
 */
process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Server startup function
 * @description Initializes the service, connects to database, and starts HTTP server
 * @returns {Promise<void>}
 */
const startServer = async () => {
  try {
    // Establish database connection
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Initialize background task scheduler
    scheduler.init();
    console.log('✅ Task scheduler initialized');
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Products Service running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`📦 Inventory Management: Enabled`);
      console.log(`⏰ Scheduled Tasks: ${scheduler.getTasksInfo().length} active`);
      console.log(`🌍 Environment: ${config.server.env}`);
      console.log('✅ Service ready to handle requests\n');
    });

    /**
     * Server error handler
     * @description Handles server-specific errors like port conflicts
     */
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      // Handle specific server startup errors
      switch (error.code) {
        case 'EACCES':
          console.error(`❌ Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    console.error('❌ Failed to start Products Service:', error);
    process.exit(1);
  }
};

// Start the application
startServer();