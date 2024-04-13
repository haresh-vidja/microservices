/**
 * Product Routes
 * API routes for product operations
 */

const express = require('express');
const productController = require('../controllers/productController');
const { verifyServiceKey } = require('../middleware/auth');

const router = express.Router();

// Public product endpoints
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProduct);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Seller-specific endpoints
router.get('/products/seller/:sellerId', productController.getSellerProducts);
router.get('/products/seller/:sellerId/analytics', productController.getSellerAnalytics);

// Stock management
router.put('/products/:id/stock', productController.updateStock);

// Product history
router.get('/products/:id/history', productController.getProductHistory);

// Service-to-service endpoints (require service key)
router.post('/service/products/bulk', verifyServiceKey, productController.getBulkProducts);
router.post('/service/products/validate-seller', verifyServiceKey, productController.validateSellerOwnership);
router.post('/service/products/record-sale', verifyServiceKey, productController.recordSale);
router.put('/service/products/stock', verifyServiceKey, productController.updateBulkStock);
router.post('/service/products/inventory-check', verifyServiceKey, productController.checkInventoryAvailability);

module.exports = router;