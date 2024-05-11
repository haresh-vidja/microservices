/**
 * Product Routes
 * API routes for product operations
 */

const express = require('express');
const productController = require('../controllers/productController');
const { verifyServiceKey } = require('../middleware/auth');

const router = express.Router();

// Admin endpoints (require service key) - Must come before generic routes
router.get('/products/admin', verifyServiceKey, productController.getAllProducts);
router.patch('/products/admin/:id/status', verifyServiceKey, productController.updateProductStatus);

// Seller-specific endpoints (specific routes before generic ones)
router.get('/products/seller/:sellerId', productController.getSellerProducts);
router.get('/products/seller/:sellerId/analytics', productController.getSellerAnalytics);

// Product history (specific route before generic :id route)
router.get('/products/:id/history', productController.getProductHistory);

// Stock management (specific route before generic :id route)
router.put('/products/:id/stock', productController.updateStock);

// Public product endpoints
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProduct);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Service-to-service endpoints (require service key)
router.post('/service/products/bulk', verifyServiceKey, productController.getBulkProducts);
router.post('/service/products/validate-seller', verifyServiceKey, productController.validateSellerOwnership);
router.post('/service/products/record-sale', verifyServiceKey, productController.recordSale);
router.put('/service/products/stock', verifyServiceKey, productController.updateBulkStock);
router.post('/service/products/inventory-check', verifyServiceKey, productController.checkInventoryAvailability);

module.exports = router;