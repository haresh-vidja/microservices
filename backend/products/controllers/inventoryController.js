/**
 * Inventory Controller
 * Handles HTTP requests for inventory operations
 */

const inventoryService = require('../services/inventoryService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

class InventoryController {
  /**
   * Create or sync inventory for a product
   */
  async createOrSyncInventory(req, res) {
    try {
      const { lowStockThreshold = 5 } = req.body;
      const result = await inventoryService.createOrSyncInventory(req.params.id, { lowStockThreshold });
      return sendSuccess(res, 'Inventory created/synced successfully', result);
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      return sendError(res, error.message, statusCode);
    }
  }

  /**
   * Get inventory for a product
   */
  async getProductInventory(req, res) {
    try {
      const inventory = await inventoryService.getProductInventory(req.params.id);
      return sendSuccess(res, 'Inventory retrieved successfully', inventory);
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      return sendError(res, error.message, statusCode);
    }
  }

  /**
   * Get seller inventory overview
   */
  async getSellerInventory(req, res) {
    try {
      const { page = 1, limit = 20, status = 'all' } = req.query;
      const { sellerId } = req.params;
      
      const filters = { status };
      const pagination = { page, limit };
      
      const result = await inventoryService.getSellerInventory(sellerId, filters, pagination);
      
      return res.json({
        success: true,
        data: {
          inventories: result.inventories,
          pagination: result.pagination,
          summary: result.summary
        }
      });
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  /**
   * Manual stock adjustment
   */
  async adjustStock(req, res) {
    try {
      const { newStock, reason = 'Manual adjustment', notes = '' } = req.body;
      
      const adjustmentData = { newStock, reason, notes };
      const result = await inventoryService.adjustStock(req.params.id, adjustmentData);
      
      return sendSuccess(res, 'Stock adjusted successfully', result);
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 :
                         error.message.includes('must be a non-negative number') ? 400 : 500;
      return sendError(res, error.message, statusCode);
    }
  }

  /**
   * Get inventory movements/history
   */
  async getInventoryMovements(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      
      const filters = { type };
      const pagination = { page, limit };
      
      const result = await inventoryService.getInventoryMovements(req.params.id, filters, pagination);
      
      return res.json({
        success: true,
        data: {
          movements: result.movements,
          pagination: result.pagination,
          currentStock: result.currentStock
        }
      });
    } catch (error) {
      const statusCode = error.message === 'Inventory not found' ? 404 : 500;
      return sendError(res, error.message, statusCode);
    }
  }

  // Service-to-service endpoints

  /**
   * Reserve stock for order
   */
  async reserveStock(req, res) {
    try {
      const { orderId, customerId, items, expirationMinutes = 30 } = req.body;
      
      const reservationData = { orderId, customerId, items, expirationMinutes };
      const result = await inventoryService.reserveStock(reservationData);
      
      const statusCode = result.success ? 200 : 400;
      const message = result.success ? 'All items reserved successfully' : 'Some reservations failed';
      
      return res.status(statusCode).json({
        success: result.success,
        message,
        data: result
      });
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  /**
   * Confirm reservations (convert to sales)
   */
  async confirmReservations(req, res) {
    try {
      const { orderId, items } = req.body;
      
      const confirmationData = { orderId, items };
      const result = await inventoryService.confirmReservations(confirmationData);
      
      return sendSuccess(res, 'Reservations confirmed successfully', result);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  /**
   * Release reservations (cancel/timeout)
   */
  async releaseReservations(req, res) {
    try {
      const { orderId, reason = 'Order cancelled' } = req.body;
      
      const releaseData = { orderId, reason };
      const result = await inventoryService.releaseReservations(releaseData);
      
      return sendSuccess(res, 'Reservations released successfully', result);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  /**
   * Check stock availability
   */
  async checkAvailability(req, res) {
    try {
      const { items } = req.body;
      
      const result = await inventoryService.checkAvailability(items);
      
      return sendSuccess(res, 'Availability checked successfully', result);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  /**
   * Clean expired reservations
   */
  async cleanExpiredReservations(req, res) {
    try {
      const result = await inventoryService.cleanExpiredReservations();
      
      return sendSuccess(res, `Cleaned ${result.cleanedCount} expired reservations`, result);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  /**
   * Initialize inventory for all products (admin function)
   */
  async initializeAllInventory(req, res) {
    try {
      const result = await inventoryService.initializeAllInventory();
      
      return sendSuccess(res, `Initialized inventory for ${result.initialized} products`, result);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  /**
   * Sync product inventory (admin function)
   */
  async syncProductInventory(req, res) {
    try {
      const result = await inventoryService.syncProductInventory();
      
      return sendSuccess(res, `Synced ${result.synced} products with inventory`, result);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }
}

module.exports = new InventoryController();