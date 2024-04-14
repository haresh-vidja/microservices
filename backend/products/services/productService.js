/**
 * Product Service
 * Business logic for product operations
 */

const Product = require('../models/Product');
const ProductHistory = require('../models/ProductHistory');
const mediaClient = require('../utils/mediaClient');

class ProductService {
  /**
   * Get products with filters and pagination
   */
  async getProducts(filters = {}, pagination = {}) {
    const { 
      category, 
      sellerId, 
      search, 
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;
    
    const { page = 1, limit = 10 } = pagination;
    
    let query = {};
    
    // Status filter
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;
    // 'all' includes both active and inactive
    
    // Other filters
    if (category) query.category = new RegExp(category, 'i');
    if (sellerId) query.sellerId = sellerId;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortOptions);
    
    const total = await Product.countDocuments(query);
    
    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Get single product by ID
   */
  async getProductById(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  /**
   * Create new product
   */
  async createProduct(productData) {
    // Validate media files if provided (only validate media_id based images)
    if (productData.images && productData.images.length > 0) {
      const mediaIds = productData.images
        .filter(img => img.media_id)
        .map(img => img.media_id);
      
      if (mediaIds.length > 0) {
        const validation = await mediaClient.validateMediaFiles(mediaIds);
        
        if (validation.invalid.length > 0) {
          throw new Error(`Invalid media files: ${validation.invalid.map(i => i.id).join(', ')}`);
        }
      }
    }
    
    const product = new Product(productData);
    await product.save();
    
    // Mark media files as used after successful product creation
    if (product.images && product.images.length > 0) {
      const mediaIds = product.images
        .filter(img => img.media_id)
        .map(img => img.media_id);
      
      if (mediaIds.length > 0) {
        mediaClient.markMultipleAsUsed(mediaIds); // Don't await - run async
      }
    }
    
    return product;
  }

  /**
   * Update product
   */
  async updateProduct(id, updateData) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Validate media files if being updated (only validate media_id based images)
    if (updateData.images && updateData.images.length > 0) {
      const mediaIds = updateData.images
        .filter(img => img.media_id)
        .map(img => img.media_id);
      
      if (mediaIds.length > 0) {
        const validation = await mediaClient.validateMediaFiles(mediaIds);
        
        if (validation.invalid.length > 0) {
          throw new Error(`Invalid media files: ${validation.invalid.map(i => i.id).join(', ')}`);
        }
      }
    }
    
    // Track price changes
    if (updateData.price && updateData.price !== product.price) {
      await new ProductHistory({
        productId: product._id,
        type: 'price_change',
        previousPrice: product.price,
        newPrice: updateData.price,
        notes: 'Price updated via API'
      }).save();
    }
    
    // Track status changes
    if (typeof updateData.isActive === 'boolean' && updateData.isActive !== product.isActive) {
      await new ProductHistory({
        productId: product._id,
        type: 'status_change',
        previousStatus: product.isActive ? 'active' : 'inactive',
        newStatus: updateData.isActive ? 'active' : 'inactive',
        notes: 'Status updated via API'
      }).save();
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Mark new media files as used if images were updated
    if (updateData.images) {
      const mediaIds = updateData.images
        .filter(img => img.media_id)
        .map(img => img.media_id);
      
      if (mediaIds.length > 0) {
        mediaClient.markMultipleAsUsed(mediaIds); // Don't await - run async
      }
    }
    
    return updatedProduct;
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Create history entry
    await new ProductHistory({
      productId: product._id,
      type: 'status_change',
      previousStatus: product.isActive ? 'active' : 'inactive',
      newStatus: 'inactive',
      notes: 'Product deleted via API'
    }).save();
    
    product.isActive = false;
    await product.save();
    
    return product;
  }

  /**
   * Update product stock
   */
  async updateStock(id, newStock, notes = '') {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (typeof newStock !== 'number' || newStock < 0) {
      throw new Error('Stock must be a non-negative number');
    }
    
    const previousStock = product.stock;
    const stockChange = newStock - previousStock;
    
    // Create history entry
    await new ProductHistory({
      productId: product._id,
      type: stockChange > 0 ? 'stock_add' : 'stock_reduce',
      quantity: Math.abs(stockChange),
      previousStock,
      newStock,
      notes
    }).save();
    
    product.stock = newStock;
    await product.save();
    
    return {
      productId: product._id,
      previousStock,
      newStock,
      stockChange
    };
  }

  /**
   * Get product history
   */
  async getProductHistory(id, filters = {}, pagination = {}) {
    const { type = 'all' } = filters;
    const { page = 1, limit = 10 } = pagination;
    
    let query = { productId: id };
    if (type !== 'all') query.type = type;
    
    const history = await ProductHistory.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort('-createdAt');
    
    const total = await ProductHistory.countDocuments(query);
    
    return {
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Get seller analytics
   */
  async getSellerAnalytics(sellerId, period = 30) {
    const periodStart = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    
    // Product summary using the static method
    const productSummary = await Product.getSellerSummary(sellerId);
    
    // Recent sales history
    const productIds = await Product.find({ sellerId }).distinct('_id');
    const recentSales = await ProductHistory.find({
      productId: { $in: productIds },
      type: 'sale',
      createdAt: { $gte: periodStart }
    }).sort('-createdAt').limit(10);
    
    // Sales analytics using the static method
    const salesAnalytics = await ProductHistory.getSalesAnalytics(sellerId, period);
    
    return {
      summary: productSummary,
      recentSales,
      salesAnalytics,
      period
    };
  }

  /**
   * Get products by seller with summary
   */
  async getSellerProducts(sellerId, filters = {}, pagination = {}) {
    const result = await this.getProducts(
      { ...filters, sellerId }, 
      pagination
    );
    
    // Add summary statistics
    const summary = {
      total: result.pagination.total,
      active: await Product.countDocuments({ sellerId, isActive: true }),
      inactive: await Product.countDocuments({ sellerId, isActive: false }),
      lowStock: await Product.countDocuments({
        sellerId,
        isActive: true,
        $expr: { $lte: ['$stock', '$lowStockAlert'] }
      })
    };
    
    return {
      ...result,
      summary
    };
  }

  /**
   * Record product sale (called by orders service)
   */
  async recordSale(saleData) {
    const { orderId, customerId, items } = saleData;
    
    if (!items || !Array.isArray(items)) {
      throw new Error('items array is required');
    }
    
    const results = [];
    
    for (const item of items) {
      try {
        const product = await Product.findById(item.productId);
        
        if (!product) {
          results.push({
            productId: item.productId,
            success: false,
            message: 'Product not found'
          });
          continue;
        }
        
        // Update product sales metrics
        product.totalSold += item.quantity;
        product.revenue += item.totalPrice;
        await product.save();
        
        // Create history entry
        await new ProductHistory({
          productId: product._id,
          type: 'sale',
          orderId,
          customerId,
          quantity: item.quantity,
          metadata: {
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            productName: product.name
          }
        }).save();
        
        results.push({
          productId: item.productId,
          success: true,
          quantity: item.quantity,
          totalPrice: item.totalPrice
        });
      } catch (error) {
        results.push({
          productId: item.productId,
          success: false,
          message: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Get bulk products (for order service)
   */
  async getBulkProducts(productIds) {
    if (!productIds || !Array.isArray(productIds)) {
      throw new Error('productIds array is required');
    }
    
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    }).select('_id name price stock sellerId images category');
    
    return products.map(product => {
      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
      return {
        id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        sellerId: product.sellerId,
        primaryImageId: primaryImage?.media_id,
        category: product.category,
        images: product.images.map(img => ({
          media_id: img.media_id,
          isPrimary: img.isPrimary
        }))
      };
    });
  }

  /**
   * Validate seller ownership of product
   */
  async validateSellerOwnership(productId, sellerId) {
    const product = await Product.findById(productId).select('sellerId');
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return {
      productId,
      sellerId,
      isValid: product.sellerId === sellerId,
      actualSellerId: product.sellerId
    };
  }
}

module.exports = new ProductService();