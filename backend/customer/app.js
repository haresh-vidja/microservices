/**
 * Customer Service Application
 * Express application setup and configuration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const addressRoutes = require('./routes/addressRoutes');

/**
 * Create Express application
 */
const app = express();

/**
 * Trust proxy
 */
app.set('trust proxy', 1);

/**
 * Security middleware
 */
app.use(helmet());

/**
 * CORS configuration
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

/**
 * Compression middleware
 */
app.use(compression());

/**
 * Body parser middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Rate limiting
 */
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true
});

app.use('/api/v1/customers/signin', authLimiter);
app.use('/api/v1/customers/signup', authLimiter);

/**
 * Request logging middleware
 */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'customer-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env
  });
});

/**
 * Swagger documentation setup
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Customer Service API',
      version: '1.0.0',
      description: 'Customer management microservice API documentation',
      contact: {
        name: 'Haresh Vidja',
        email: 'hareshvidja@gmail.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}/api/v1`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js', './models/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }'
}));

// API documentation JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * API Routes
 */
app.use(`${config.api.prefix}/customers`, customerRoutes);
app.use(`${config.api.prefix}/addresses`, addressRoutes);

/**
 * 404 handler
 */
app.use(notFound);

/**
 * Global error handler
 */
app.use(errorHandler);

module.exports = app;