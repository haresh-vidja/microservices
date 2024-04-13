/**
 * Product Controller
 * Handles HTTP requests for product operations
 */

const productService = require('../services/productService');
const { sendSuccess, sendError, sendPaginated, createPagination } = require('../utils/response');

class ProductController {
  /**
   * Get all products
   */
  async getProducts(req, res) {
    try {
      const { page = 1, limit = 10, category, sellerId, search, status = 'active', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const filters = { category, sellerId, search, status, sortBy, sortOrder };
      const pagination = { page, limit };
      
      const result = await productService.getProducts(filters, pagination);
      
      return sendPaginated(res, 'Products retrieved successfully', result.products, result.pagination);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  /**
   * Get single product
   */
  async getProduct(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);
      return sendSuccess(res, 'Product retrieved successfully', product);
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      return sendError(res, error.message, statusCode);
    }
  }

  /**
   * Create product
   */
  async createProduct(req, res) {
    try {
      const product = await productService.createProduct(req.body);
      return sendSuccess(res, 'Product created successfully', product, 201);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  /**
   * Update product
   */
  async updateProduct(req, res) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return sendSuccess(res, 'Product updated successfully', product);
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 400;
      return sendError(res, error.message, statusCode);
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(req, res) {
    try {
      await productService.deleteProduct(req.params.id);
      return sendSuccess(res, 'Product deleted successfully');
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      return sendError(res, error.message, statusCode);
    }
  }

  /**
   * Get products by seller
   */
  async getSellerProducts(req, res) {
    try {
      const { page = 1, limit = 10, status = 'all', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      const { sellerId } = req.params;
      
      const filters = { status, sortBy, sortOrder };
      const pagination = { page, limit };
      
      const result = await productService.getSellerProducts(sellerId, filters, pagination);
      
      return res.json({
        success: true,
        data: {
          products: result.products,
          pagination: result.pagination,
          summary: result.summary
        }
      });
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  /**
   * Update stock
   */
  async updateStock(req, res) {
    try {
      const { stock, notes = '' } = req.body;
      const result = await productService.updateStock(req.params.id, stock, notes);
      return sendSuccess(res, 'Stock updated successfully', result);
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 
                         error.message.includes('Stock must be') ? 400 : 500;
      return sendError(res, error.message, statusCode);
    }
  }

  /**
   * Get product history
   */
  async getProductHistory(req, res) {
    try {
      const { page = 1, limit = 10, type = 'all' } = req.query;
      const { id } = req.params;
      
      const filters = { type };
      const pagination = { page, limit };
      
      const result = await productService.getProductHistory(id, filters, pagination);
      
      return sendPaginated(res, 'Product history retrieved successfully', result.history, result.pagination);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  /**
   * Get seller analytics
   */
  async getSellerAnalytics(req, res) {
    try {
      const { sellerId } = req.params;
      const { period = '30' } = req.query;
      
      const analytics = await productService.getSellerAnalytics(sellerId, parseInt(period));
      
      return sendSuccess(res, 'Analytics retrieved successfully', {
        ...analytics,
        period: parseInt(period)
      });
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  // Service-to-service endpoints

  /**
   * Bulk products retrieval (for order service)
   */
  async getBulkProducts(req, res) {
    try {
      const { productIds } = req.body;
      const products = await productService.getBulkProducts(productIds);
      return sendSuccess(res, 'Products retrieved successfully', products);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  /**
   * Validate seller ownership
   */
  async validateSellerOwnership(req, res) {
    try {
      const { productId, sellerId } = req.body;
      const validation = await productService.validateSellerOwnership(productId, sellerId);
      return sendSuccess(res, 'Validation completed', validation);
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      return sendError(res, error.message, statusCode);
    }
  }

  /**
   * Record product sale
   */
  async recordSale(req, res) {
    try {
      const results = await productService.recordSale(req.body);
      return sendSuccess(res, 'Sales recorded successfully', results);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  /**
   * Update product stock (bulk)
   */
  async updateBulkStock(req, res) {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return sendError(res, 'updates array is required', 400);
      }
      
      const results = [];
      
      for (const update of updates) {
        try {
          const product = await productService.getProductById(update.productId);
          const newStock = product.stock + update.stockChange;
          
          if (newStock < 0) {
            results.push({
              productId: update.productId,
              success: false,
              message: 'Insufficient stock for reduction'
            });
            continue;
          }
          
          const result = await productService.updateStock(
            update.productId, 
            newStock, 
            `Bulk stock update: ${update.stockChange}`
          );
          
          results.push({
            productId: update.productId,
            success: true,
            previousStock: result.previousStock,
            newStock: result.newStock,
            stockChange: update.stockChange
          });
        } catch (error) {
          results.push({
            productId: update.productId,
            success: false,
            message: error.message
          });
        }
      }
      
      return sendSuccess(res, 'Bulk stock update completed', results);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  /**
   * Check inventory availability (legacy endpoint)
   */
  async checkInventoryAvailability(req, res) {
    try {
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return sendError(res, 'items array is required', 400);
      }
      
      const productIds = items.map(item => item.productId);
      const products = await productService.getBulkProducts(productIds);
      
      const availability = items.map(item => {
        const product = products.find(p => p.id.toString() === item.productId);
        
        if (!product) {
          return {
            productId: item.productId,
            available: false,
            reason: 'Product not found',
            requestedQuantity: item.quantity,
            availableStock: 0
          };
        }
        
        const available = product.stock >= item.quantity;
        
        return {
          productId: item.productId,
          productName: product.name,
          available,
          reason: available ? 'Available' : 'Insufficient stock',
          requestedQuantity: item.quantity,
          availableStock: product.stock
        };
      });
      
      const allAvailable = availability.every(item => item.available);
      
      return sendSuccess(res, 'Availability checked successfully', {
        allAvailable,
        items: availability,
        summary: {
          total: items.length,
          available: availability.filter(item => item.available).length,
          unavailable: availability.filter(item => !item.available).length
        }
      });
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }
}

module.exports = new ProductController();