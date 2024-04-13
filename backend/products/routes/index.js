/**
 * Routes Index
 * Centralized route management
 */

const express = require('express');
const productRoutes = require('./productRoutes');
const inventoryRoutes = require('./inventoryRoutes');

const router = express.Router();

// Mount route modules
router.use('/v1', productRoutes);
router.use('/v1', inventoryRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'products-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

module.exports = router;