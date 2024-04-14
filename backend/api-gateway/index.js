/**
 * API Gateway - Single Entry Point for All Microservices
 * Routes requests to appropriate microservices using proxy middleware
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Security and performance middleware
app.use(helmet());
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Key', 'X-Requested-With']
}));
app.use(compression());
// Only parse JSON for non-multipart requests
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Service configuration
const services = {
  customer: {
    target: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3001',
    pathRewrite: { '^/api/customer': '/api/v1' }
  },
  sellers: {
    target: process.env.SELLERS_SERVICE_URL || 'http://localhost:3002',
    pathRewrite: { '^/api/sellers': '/api/v1' }
  },
  media: {
    target: process.env.MEDIA_SERVICE_URL || 'http://localhost:3003',
    pathRewrite: { '^/api/media': '/api/v1' }
  },
  products: {
    target: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3004',
    pathRewrite: { '^/api/products': '/api/v1' }
  },
  orders: {
    target: process.env.ORDERS_SERVICE_URL || 'http://localhost:3005',
    pathRewrite: { '^/api/orders': '/api/v1' }
  },
  admin: {
    target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3006',
    pathRewrite: { '^/api/admin': '/api/v1' }
  },
  notifications: {
    target: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3007',
    pathRewrite: { '^/api/notifications': '/api/v1' }
  }
};

// Health check for API Gateway
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: Object.keys(services),
    version: '1.0.0'
  });
});

// Secure media access routes
app.get('/media/:media_id', async (req, res) => {
  const { media_id } = req.params;
  
  try {
    const response = await axios({
      method: 'GET',
      url: `${services.media.target}/api/v1/media/serve/${media_id}`,
      responseType: 'stream',
      timeout: 10000
    });

    // Forward headers from media service
    res.set(response.headers);
    
    // Stream the media file
    response.data.pipe(res);
    
  } catch (error) {
    console.error(`Media serving error for ID ${media_id}:`, error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: error.response.data?.message || 'Media not found',
        media_id: media_id
      });
    } else {
      res.status(502).json({
        success: false,
        message: 'Media service unavailable',
        media_id: media_id
      });
    }
  }
});

app.get('/thumb/:media_id', async (req, res) => {
  const { media_id } = req.params;
  
  try {
    console.log(`Requesting thumbnail for media ID: ${media_id}`);
    const response = await axios({
      method: 'GET',
      url: `${services.media.target}/api/v1/media/serve-thumb/${media_id}`,
      responseType: 'stream',
      timeout: 10000
    });

    console.log(`Thumbnail response received for ${media_id}, headers:`, Object.keys(response.headers));
    
    // Forward headers from media service
    res.set(response.headers);
    
    // Handle stream errors
    response.data.on('error', (streamError) => {
      console.error(`Stream error for thumbnail ${media_id}:`, streamError);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming thumbnail',
          media_id: media_id
        });
      }
    });
    
    // Stream the thumbnail
    response.data.pipe(res);
    
  } catch (error) {
    console.error(`Thumbnail serving error for ID ${media_id}:`, error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: error.response.data?.message || 'Thumbnail not found',
        media_id: media_id
      });
    } else {
      res.status(502).json({
        success: false,
        message: 'Media service unavailable',
        media_id: media_id
      });
    }
  }
});

// Service status endpoint
app.get('/api/status', async (req, res) => {
  const serviceStatus = {};
  
  for (const [name, config] of Object.entries(services)) {
    try {
      const response = await axios.get(`${config.target}/health`, { timeout: 3000 });
      serviceStatus[name] = {
        status: 'healthy',
        url: config.target,
        response: response.data
      };
    } catch (error) {
      serviceStatus[name] = {
        status: 'unhealthy',
        url: config.target,
        error: error.message
      };
    }
  }
  
  res.json({
    success: true,
    gateway: 'healthy',
    services: serviceStatus,
    timestamp: new Date().toISOString()
  });
});

// Create proxy middleware for each service
Object.entries(services).forEach(([serviceName, config]) => {
  const proxyOptions = {
    target: config.target,
    changeOrigin: true,
    pathRewrite: config.pathRewrite,
    timeout: 30000,
    proxyTimeout: 30000,
    followRedirects: true,
    secure: false,
    
    // Handle errors
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}:`, err.message);
      res.status(502).json({
        success: false,
        message: `${serviceName} service unavailable`,
        error: 'Bad Gateway',
        timestamp: new Date().toISOString()
      });
    },
    
    // Log proxy requests in development
    onProxyReq: (proxyReq, req, res) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${config.target}${proxyReq.path}`);
      }
      
      // Only handle JSON body for non-multipart requests
      if (req.body && 
          (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') &&
          req.headers['content-type'] && 
          !req.headers['content-type'].includes('multipart/form-data')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      // For multipart/form-data, let the proxy handle it natively
    },
    
    // Handle proxy response
    onProxyRes: (proxyRes, req, res) => {
      // Add service identifier header
      res.setHeader('X-Service-Name', serviceName);
      res.setHeader('X-Gateway', 'api-gateway');
    }
  };
  
  // Apply proxy middleware to service routes
  app.use(`/api/${serviceName}`, createProxyMiddleware(proxyOptions));
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Gateway Documentation',
    gateway: {
      version: '1.0.0',
      port: PORT,
      endpoints: {
        health: 'GET /health',
        status: 'GET /api/status',
        docs: 'GET /api/docs'
      }
    },
    services: {
      customer: {
        prefix: '/api/customer',
        target: services.customer.target,
        description: 'Customer management, authentication, and profiles'
      },
      sellers: {
        prefix: '/api/sellers',
        target: services.sellers.target,
        description: 'Seller management, authentication, and business profiles'
      },
      media: {
        prefix: '/api/media',
        target: services.media.target,
        description: 'File upload, media management, and storage'
      },
      products: {
        prefix: '/api/products',
        target: services.products.target,
        description: 'Product catalog, inventory, and management'
      },
      orders: {
        prefix: '/api/orders',
        target: services.orders.target,
        description: 'Order processing, cart management, and inventory'
      },
      admin: {
        prefix: '/api/admin',
        target: services.admin.target,
        description: 'Admin dashboard, statistics, and service monitoring'
      },
      notifications: {
        prefix: '/api/notifications',
        target: services.notifications.target,
        description: 'Email notifications, templates, and messaging'
      }
    },
    examples: {
      customer_signup: 'POST /api/customer/customers/signup',
      seller_signin: 'POST /api/sellers/sellers/signin',
      upload_media: 'POST /api/media/media/upload',
      list_products: 'GET /api/products/products',
      place_order: 'POST /api/orders/orders/place',
      dashboard_stats: 'GET /api/admin/dashboard/stats',
      send_email: 'POST /api/notifications/send'
    }
  });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableServices: Object.keys(services).map(name => `/api/${name}`),
    documentation: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Gateway Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal Gateway Error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down API Gateway gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nAPI Gateway terminated gracefully...');
  process.exit(0);
});

// Start the gateway server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 Service Status: http://localhost:${PORT}/api/status`);
  console.log('\n📡 Available Services:');
  
  Object.entries(services).forEach(([name, config]) => {
    console.log(`   • ${name.toUpperCase()}: /api/${name} -> ${config.target}`);
  });
  
  console.log(`\n⚡ Gateway ready to proxy requests to ${Object.keys(services).length} microservices!`);
});