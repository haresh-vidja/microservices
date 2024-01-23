/**
 * Orders Service Entry Point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { connectDB } = require('./config/database');
const orderService = require('./services/orderService');
const kafkaClient = require('./utils/kafkaClient');
const config = require('./config');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'orders-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Add to cart
app.post('/api/v1/cart/add', async (req, res) => {
  try {
    const { customerId, productId, quantity } = req.body;
    const cart = await orderService.addToCart(customerId, productId, quantity);
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Place order
app.post('/api/v1/orders', async (req, res) => {
  try {
    const { customerId, shippingAddressId, notes } = req.body;
    const order = await orderService.placeOrder(customerId, shippingAddressId, notes);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get order
app.get('/api/v1/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customerId } = req.query;
    const order = await orderService.getOrder(orderId, customerId);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// Cancel order
app.put('/api/v1/orders/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customerId, reason } = req.body;
    const order = await orderService.cancelOrder(orderId, customerId, reason);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await kafkaClient.initProducer();
    
    app.listen(PORT, () => {
      console.log(`Orders Service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start orders service:', error);
  }
};

startServer();