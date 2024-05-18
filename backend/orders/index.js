/**
 * Orders Service Entry Point
 * 
 * @fileoverview Order management and cart functionality service
 * @description This service handles order processing, cart management, inventory
 * reservations, and integrates with Kafka for event-driven communication with
 * other microservices.
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

const { connectDB } = require('./config/database');
const kafkaClient = require('./utils/kafkaClient');
const config = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

/**
 * API Routes Configuration
 * @description Imports order-related API endpoints
 */
const orderRoutes = require('./routes/orderRoutes');

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
      title: 'Orders Service API',
      version: '1.0.0',
      description: 'Order management and cart functionality API',
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
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for user authentication'
        },
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
 * Health Check Endpoint
 * @description Provides service health status for monitoring and load balancer checks
 * @route GET /health
 * @returns {Object} Service health information
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'orders-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

/**
 * API Routes Configuration
 * @description Mounts all order-related API endpoints
 */
app.use('/api/v1', orderRoutes);

/**
 * Global Error Handling Middleware
 * @description Catches and processes all unhandled errors
 */
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

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
    
    // Initialize Kafka producer for event messaging (non-blocking)
    // This allows the service to start even if Kafka is unavailable
    kafkaClient.initProducer().catch(error => {
      console.error('❌ Kafka initialization failed (non-blocking):', error.message);
      console.log('ℹ️  Orders service will continue without Kafka messaging');
      console.log('ℹ️  Some features may be limited without event messaging');
    });
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Orders Service running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🛒 Order Management: Enabled`);
      console.log(`📦 Cart Functionality: Active`);
      console.log(`🌍 Environment: ${config.env || 'development'}`);
      console.log('✅ Service ready to handle requests');
    });
  } catch (error) {
    console.error('❌ Failed to start orders service:', error);
    process.exit(1);
  }
};

// Start the application
startServer();