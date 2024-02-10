/**
 * Admin Service Entry Point
 * Provides admin panel APIs and statistics
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3006;

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

// Get dashboard statistics
app.get('/api/v1/dashboard/stats', async (req, res) => {
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
app.get('/api/v1/services/health', async (req, res) => {
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
app.all('/api/v1/proxy/:service/*', async (req, res) => {
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
    
    const config = {
      method: req.method,
      url: serviceUrl,
      headers: { ...req.headers },
      timeout: 30000
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      config.data = req.body;
    }

    const response = await axios(config);
    res.status(response.status).json(response.data);

  } catch (error) {
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