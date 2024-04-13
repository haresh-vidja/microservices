/**
 * Inventory Routes
 * API routes for inventory operations
 */

const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { verifyServiceKey } = require('../middleware/auth');

const router = express.Router();

// Product inventory endpoints
router.post('/products/:id/inventory', inventoryController.createOrSyncInventory);
router.get('/products/:id/inventory', inventoryController.getProductInventory);
router.put('/products/:id/inventory/adjust', inventoryController.adjustStock);
router.get('/products/:id/inventory/movements', inventoryController.getInventoryMovements);

// Seller inventory overview
router.get('/inventory/seller/:sellerId', inventoryController.getSellerInventory);

// Service-to-service inventory endpoints (require service key)
router.post('/service/inventory/reserve', verifyServiceKey, inventoryController.reserveStock);
router.post('/service/inventory/confirm', verifyServiceKey, inventoryController.confirmReservations);
router.post('/service/inventory/release', verifyServiceKey, inventoryController.releaseReservations);
router.post('/service/inventory/check-availability', verifyServiceKey, inventoryController.checkAvailability);
router.post('/service/inventory/cleanup-expired', verifyServiceKey, inventoryController.cleanExpiredReservations);

// Admin endpoints (require service key)
router.post('/service/inventory/initialize-all', verifyServiceKey, inventoryController.initializeAllInventory);
router.post('/service/inventory/sync-products', verifyServiceKey, inventoryController.syncProductInventory);

module.exports = router;