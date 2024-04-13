/**
 * Inventory Service
 * Business logic for inventory management operations
 */

const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

class InventoryService {
  /**
   * Create or sync inventory for a product
   */
  async createOrSyncInventory(productId, options = {}) {
    const { lowStockThreshold = 5 } = options;
    
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Check if inventory already exists
    let inventory = await Inventory.findOne({ productId: product._id });
    
    if (inventory) {
      // Update existing inventory
      inventory.totalStock = product.stock;
      inventory.lowStockThreshold = lowStockThreshold;
      await inventory.save();
    } else {
      // Create new inventory
      inventory = new Inventory({
        productId: product._id,
        sellerId: product.sellerId,
        totalStock: product.stock,
        lowStockThreshold
      });
      await inventory.save();
    }
    
    return inventory.getStockSummary();
  }

  /**
   * Get inventory for a product
   */
  async getProductInventory(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    let inventory = await Inventory.findOne({ productId: product._id }).populate('productId');
    
    if (!inventory) {
      // Create default inventory if it doesn't exist
      inventory = new Inventory({
        productId: product._id,
        sellerId: product.sellerId,
        totalStock: product.stock || 0
      });
      await inventory.save();
    }
    
    return {
      ...inventory.getStockSummary(),
      reservations: inventory.getReservations(),
      movements: inventory.movements.slice(-10) // Last 10 movements
    };
  }

  /**
   * Reserve stock for order
   */
  async reserveStock(reservationData) {
    const { orderId, customerId, items, expirationMinutes = 30 } = reservationData;
    
    if (!items || !Array.isArray(items)) {
      throw new Error('items array is required');
    }
    
    const reservationResults = [];
    const failedReservations = [];
    
    // Process each item reservation
    for (const item of items) {
      try {
        let inventory = await Inventory.findOne({ productId: item.productId });
        
        if (!inventory) {
          // Auto-create inventory from product data
          const product = await Product.findById(item.productId);
          if (!product) {
            failedReservations.push({
              productId: item.productId,
              error: 'Product not found'
            });
            continue;
          }
          
          inventory = new Inventory({
            productId: product._id,
            sellerId: product.sellerId,
            totalStock: product.stock || 0
          });
          await inventory.save();
        }
        
        // Reserve the stock
        await inventory.reserveStock(orderId, customerId, item.quantity, expirationMinutes);
        
        reservationResults.push({
          productId: item.productId,
          reserved: item.quantity,
          availableAfterReservation: inventory.availableStock,
          expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000)
        });
        
      } catch (error) {
        failedReservations.push({
          productId: item.productId,
          error: error.message
        });
      }
    }
    
    const allSucceeded = failedReservations.length === 0;
    
    if (!allSucceeded) {
      // If any reservations failed, release all successful ones
      for (const result of reservationResults) {
        try {
          const inventory = await Inventory.findOne({ productId: result.productId });
          if (inventory) {
            await inventory.releaseReservation(orderId, 'Partial reservation failure - rollback');
          }
        } catch (rollbackError) {
          console.error('Error during reservation rollback:', rollbackError);
        }
      }
    }
    
    return {
      success: allSucceeded,
      successful: reservationResults,
      failed: failedReservations,
      orderId,
      expirationMinutes
    };
  }

  /**
   * Confirm reservations (convert to sales)
   */
  async confirmReservations(confirmationData) {
    const { orderId, items } = confirmationData;
    
    const confirmResults = [];
    const failedConfirmations = [];
    
    for (const item of items) {
      try {
        const inventory = await Inventory.findOne({ productId: item.productId });
        
        if (!inventory) {
          failedConfirmations.push({
            productId: item.productId,
            error: 'Inventory not found'
          });
          continue;
        }
        
        await inventory.confirmReservation(orderId);
        
        confirmResults.push({
          productId: item.productId,
          confirmed: item.quantity,
          newSoldStock: inventory.soldStock
        });
        
        // Update product sales metrics
        const product = await Product.findById(item.productId);
        if (product) {
          product.totalSold += item.quantity;
          product.revenue += (item.unitPrice * item.quantity);
          await product.save();
        }
        
      } catch (error) {
        failedConfirmations.push({
          productId: item.productId,
          error: error.message
        });
      }
    }
    
    return {
      successful: confirmResults,
      failed: failedConfirmations,
      orderId
    };
  }

  /**
   * Release reservations (cancel/timeout)
   */
  async releaseReservations(releaseData) {
    const { orderId, reason = 'Order cancelled' } = releaseData;
    
    const inventories = await Inventory.find({
      'reservations.orderId': orderId,
      'reservations.status': 'active'
    });
    
    const releaseResults = [];
    
    for (const inventory of inventories) {
      try {
        await inventory.releaseReservation(orderId, reason);
        
        releaseResults.push({
          productId: inventory.productId,
          released: true,
          newAvailableStock: inventory.availableStock
        });
      } catch (error) {
        releaseResults.push({
          productId: inventory.productId,
          released: false,
          error: error.message
        });
      }
    }
    
    return {
      results: releaseResults,
      orderId,
      reason
    };
  }

  /**
   * Check stock availability
   */
  async checkAvailability(items) {
    if (!items || !Array.isArray(items)) {
      throw new Error('items array is required');
    }
    
    const availability = [];
    
    for (const item of items) {
      try {
        let inventory = await Inventory.findOne({ productId: item.productId }).populate('productId');
        
        if (!inventory) {
          // Create from product if inventory doesn't exist
          const product = await Product.findById(item.productId);
          if (!product) {
            availability.push({
              productId: item.productId,
              available: false,
              reason: 'Product not found',
              requestedQuantity: item.quantity,
              availableStock: 0
            });
            continue;
          }
          
          inventory = new Inventory({
            productId: product._id,
            sellerId: product.sellerId,
            totalStock: product.stock || 0
          });
          await inventory.save();
        }
        
        const isAvailable = inventory.availableStock >= item.quantity;
        
        availability.push({
          productId: item.productId,
          productName: inventory.productId?.name || 'Unknown',
          available: isAvailable,
          reason: isAvailable ? 'Available' : 'Insufficient stock',
          requestedQuantity: item.quantity,
          availableStock: inventory.availableStock,
          totalStock: inventory.totalStock,
          reservedStock: inventory.reservedStock
        });
        
      } catch (error) {
        availability.push({
          productId: item.productId,
          available: false,
          reason: error.message,
          requestedQuantity: item.quantity,
          availableStock: 0
        });
      }
    }
    
    const allAvailable = availability.every(item => item.available);
    
    return {
      allAvailable,
      items: availability,
      summary: {
        total: items.length,
        available: availability.filter(item => item.available).length,
        unavailable: availability.filter(item => !item.available).length
      }
    };
  }

  /**
   * Get seller inventory overview
   */
  async getSellerInventory(sellerId, filters = {}, pagination = {}) {
    const { status = 'all' } = filters;
    const { page = 1, limit = 20 } = pagination;
    
    let query = { sellerId };
    
    if (status === 'low') query.isLowStock = true;
    else if (status === 'out') query.isOutOfStock = true;
    else if (status === 'active') query.isActive = true;
    
    const inventories = await Inventory.find(query)
      .populate('productId', 'name category price images')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort('-updatedAt');
    
    const total = await Inventory.countDocuments(query);
    
    // Get summary statistics
    const summary = await Inventory.aggregate([
      { $match: { sellerId } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$totalStock' },
          totalReserved: { $sum: '$reservedStock' },
          totalSold: { $sum: '$soldStock' },
          totalAvailable: { $sum: '$availableStock' },
          lowStockCount: { $sum: { $cond: ['$isLowStock', 1, 0] } },
          outOfStockCount: { $sum: { $cond: ['$isOutOfStock', 1, 0] } }
        }
      }
    ]);
    
    return {
      inventories: inventories.map(inv => ({
        ...inv.getStockSummary(),
        productName: inv.productId?.name,
        productCategory: inv.productId?.category,
        productPrice: inv.productId?.price,
        activeReservations: inv.getReservations('active').length
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      summary: summary[0] || {
        totalProducts: 0,
        totalStock: 0,
        totalReserved: 0,
        totalSold: 0,
        totalAvailable: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      }
    };
  }

  /**
   * Manual stock adjustment
   */
  async adjustStock(productId, adjustmentData) {
    const { newStock, reason = 'Manual adjustment', notes = '' } = adjustmentData;
    
    if (typeof newStock !== 'number' || newStock < 0) {
      throw new Error('newStock must be a non-negative number');
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    let inventory = await Inventory.findOne({ productId: product._id });
    
    if (!inventory) {
      inventory = new Inventory({
        productId: product._id,
        sellerId: product.sellerId,
        totalStock: newStock
      });
      await inventory.save();
    } else {
      await inventory.adjustStock(newStock, reason, notes);
    }
    
    // Update product stock to match
    product.stock = newStock;
    await product.save();
    
    return inventory.getStockSummary();
  }

  /**
   * Get inventory movements/history
   */
  async getInventoryMovements(productId, filters = {}, pagination = {}) {
    const { type } = filters;
    const { page = 1, limit = 20 } = pagination;
    
    const inventory = await Inventory.findOne({ productId }).populate('productId');
    
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    
    let movements = inventory.movements;
    
    if (type && type !== 'all') {
      movements = movements.filter(m => m.type === type);
    }
    
    // Sort by timestamp descending
    movements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedMovements = movements.slice(startIndex, startIndex + parseInt(limit));
    
    return {
      movements: paginatedMovements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: movements.length,
        pages: Math.ceil(movements.length / parseInt(limit))
      },
      currentStock: inventory.getStockSummary()
    };
  }

  /**
   * Clean expired reservations
   */
  async cleanExpiredReservations() {
    const cleanedCount = await Inventory.cleanExpiredReservations();
    return { cleanedCount };
  }

  /**
   * Initialize inventory for all products without inventory records
   */
  async initializeAllInventory() {
    const products = await Product.find({ isActive: true });
    let initialized = 0;
    
    for (const product of products) {
      const existingInventory = await Inventory.findOne({ productId: product._id });
      
      if (!existingInventory) {
        const inventory = new Inventory({
          productId: product._id,
          sellerId: product.sellerId,
          totalStock: product.stock || 0,
          lowStockThreshold: product.lowStockAlert || 5
        });
        await inventory.save();
        initialized++;
      }
    }
    
    return { initialized };
  }

  /**
   * Sync product stock with inventory
   */
  async syncProductInventory() {
    const inventories = await Inventory.find({ isActive: true });
    let synced = 0;
    
    for (const inventory of inventories) {
      const product = await Product.findById(inventory.productId);
      if (product && product.stock !== inventory.totalStock) {
        product.stock = inventory.availableStock; // Use available stock for product display
        await product.save();
        synced++;
      }
    }
    
    return { synced };
  }
}

module.exports = new InventoryService();