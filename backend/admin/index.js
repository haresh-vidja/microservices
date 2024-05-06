/**
 * Admin Service Entry Point
 * Provides admin panel APIs and statistics
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3006;

// MongoDB connection
const MONGODB_URI = process.env.ADMIN_MONGODB_URI || 'mongodb://localhost:27017/admin_db';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Admin DB connected:', MONGODB_URI.split('@').pop());
}).catch(err => {
  console.error('Admin DB connection error:', err);
});

// Admin Schema
const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'moderator'], 
    default: 'admin' 
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users', 'manage_sellers', 'manage_products', 
      'manage_orders', 'view_analytics', 'manage_settings',
      'send_notifications', 'moderate_content'
    ]
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, {
  timestamps: true,
  versionKey: false
});

const Admin = mongoose.model('Admin', adminSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key';

// Admin authentication middleware
const verifyAdminToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = decoded;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Token verification failed'
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json());

// Service endpoints
const services = {
  customer: 'http://localhost:3001',
  sellers: 'http://localhost:3002',
  media: 'http://localhost:3003',
  products: 'http://localhost:3004',
  orders: 'http://localhost:3005',
  notifications: 'http://localhost:3007'
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'admin-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Admin Login
app.post('/api/v1/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: admin.role,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        }
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get dashboard statistics
app.get('/api/v1/dashboard/stats', verifyAdminToken, async (req, res) => {
  try {
    const stats = {};

    // Get stats from each service
    try {
      const customerRes = await axios.get(`${services.customer}/api/v1/customers`, {
        timeout: 5000
      });
      stats.customers = {
        total: customerRes.data.data?.pagination?.total || 0,
        active: customerRes.data.data?.customers?.filter(c => c.isActive).length || 0
      };
    } catch (error) {
      stats.customers = { total: 0, active: 0, error: 'Service unavailable' };
    }

    try {
      const sellersRes = await axios.get(`${services.sellers}/api/v1/sellers/list`, {
        timeout: 5000
      });
      stats.sellers = {
        total: sellersRes.data.data?.pagination?.total || 0,
        active: sellersRes.data.data?.sellers?.filter(s => s.isActive).length || 0
      };
    } catch (error) {
      stats.sellers = { total: 0, active: 0, error: 'Service unavailable' };
    }

    try {
      const productsRes = await axios.get(`${services.products}/api/v1/products`, {
        timeout: 5000
      });
      stats.products = {
        total: productsRes.data.data?.pagination?.total || 0
      };
    } catch (error) {
      stats.products = { total: 0, error: 'Service unavailable' };
    }

    try {
      const ordersRes = await axios.get(`${services.orders}/api/v1/admin/orders`, {
        timeout: 5000,
        headers: {
          'X-Service-Key': 'admin-secret-key-2024'
        }
      });
      stats.orders = {
        total: ordersRes.data.data?.pagination?.total || 0
      };
    } catch (error) {
      stats.orders = { total: 0, error: 'Service unavailable' };
    }

    res.json({
      success: true,
      data: {
        overview: stats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all services health
app.get('/api/v1/services/health', verifyAdminToken, async (req, res) => {
  try {
    const healthChecks = {};

    for (const [service, url] of Object.entries(services)) {
      try {
        const response = await axios.get(`${url}/health`, { timeout: 5000 });
        healthChecks[service] = {
          status: 'healthy',
          response: response.data,
          responseTime: response.headers['x-response-time'] || 'N/A'
        };
      } catch (error) {
        healthChecks[service] = {
          status: 'unhealthy',
          error: error.message,
          url: url
        };
      }
    }

    res.json({
      success: true,
      data: {
        services: healthChecks,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Proxy requests to other services
app.all('/api/v1/proxy/:service/*', verifyAdminToken, async (req, res) => {
  try {
    const serviceName = req.params.service;
    const path = req.params[0];
    
    if (!services[serviceName]) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const serviceUrl = `${services[serviceName]}/${path}`;
    
    // Prepare headers with service key for authentication
    const headers = { ...req.headers };
    
    // Add service key for inter-service communication
    headers['x-service-key'] = 'admin-secret-key-2024';
    
    // Remove original authorization header since we use service key
    delete headers.authorization;
    
    // Remove accept-encoding to prevent compression issues
    delete headers['accept-encoding'];
    
    // Set accept header for JSON
    headers['accept'] = 'application/json';
    
    const config = {
      method: req.method,
      url: serviceUrl,
      headers: headers,
      params: req.query, // Forward query parameters
      timeout: 30000,
      decompress: true, // Ensure axios handles decompression
      responseType: 'json' // Explicitly request JSON
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      config.data = req.body;
    }

    const response = await axios(config);
    
    // Set proper content type
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).json(response.data);

  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: `Proxy error: ${error.message}`
      });
    }
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Admin Service running on http://localhost:${PORT}`);
  console.log(`Connected services:`, Object.keys(services).join(', '));
});