/**
 * Product Model
 * 
 * @fileoverview Enhanced product schema with comprehensive management features
 * @description Defines the product schema for MongoDB using Mongoose. Includes
 * inventory tracking, sales analytics, image management, and business logic
 * methods for product operations.
 * 
 * @author Haresh Vidja
 * @version 1.0.0
 * @since 2023-11-01
 */

const mongoose = require('mongoose');

/**
 * Product Schema Definition
 * @description Comprehensive product schema with business logic and validation
 */
const productSchema = new mongoose.Schema({
  // Basic Product Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Product description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true
  },
  
  // Seller Information
  sellerId: {
    type: String,
    required: [true, 'Seller ID is required'],
    index: true // Indexed for faster seller-based queries
  },
  
  // Image Management
  images: [{
    media_id: {
      type: String,
      required: false, // Made optional to handle legacy data
      validate: {
        validator: function(v) {
          // Only validate format if media_id is provided
          return !v || /^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i.test(v);
        },
        message: 'Invalid media ID format - must be a valid UUID'
      }
    },
    isPrimary: { 
      type: Boolean, 
      default: false // Flag to identify the main product image
    },
    url: { 
      type: String // Support for legacy URL format
    }
  }],
  
  // Inventory Management
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  lowStockAlert: {
    type: Number,
    default: 5,
    min: [0, 'Low stock alert threshold cannot be negative']
  },
  
  // Sales Analytics
  totalSold: {
    type: Number,
    default: 0,
    min: [0, 'Total sold cannot be negative']
  },
  revenue: {
    type: Number,
    default: 0,
    min: [0, 'Revenue cannot be negative']
  },
  
  // Product Status
  isActive: {
    type: Boolean,
    default: true // Controls product visibility and availability
  },
  
  // Additional Information
  tags: [String], // Searchable tags for product discovery
  specifications: mongoose.Schema.Types.Mixed // Flexible specifications object
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  versionKey: false // Disables __v field
});

/**
 * Database Indexes for Performance Optimization
 * @description Strategic indexes to improve query performance for common operations
 */
productSchema.index({ sellerId: 1, isActive: 1 }); // Seller product queries
productSchema.index({ category: 1, isActive: 1 }); // Category-based filtering
productSchema.index({ name: 'text', description: 'text' }); // Full-text search
productSchema.index({ createdAt: -1 }); // Recent products
productSchema.index({ totalSold: -1 }); // Best-selling products
productSchema.index({ revenue: -1 }); // High-revenue products

/**
 * Virtual Properties
 * @description Computed properties that are not stored in the database
 */

/**
 * Primary Image Virtual
 * @description Returns the primary image or falls back to the first image
 * @returns {Object|undefined} Primary image object or first available image
 */
productSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg || this.images[0];
});

/**
 * Instance Methods
 * @description Business logic methods available on product instances
 */

/**
 * Check if product is low in stock
 * @description Compares current stock with low stock alert threshold
 * @returns {boolean} True if stock is at or below alert threshold
 */
productSchema.methods.isLowStock = function() {
  return this.stock <= this.lowStockAlert;
};

/**
 * Check if product is out of stock
 * @description Determines if product has zero stock
 * @returns {boolean} True if stock is zero
 */
productSchema.methods.isOutOfStock = function() {
  return this.stock === 0;
};

/**
 * Update product stock with tracking
 * @description Updates stock level and returns change information
 * @param {number} newStock - New stock level
 * @param {string} reason - Reason for stock change (default: 'Stock update')
 * @returns {Object} Object containing previous stock, new stock, change amount, and reason
 */
productSchema.methods.updateStock = function(newStock, reason = 'Stock update') {
  const previousStock = this.stock;
  this.stock = Math.max(0, newStock); // Ensure stock is never negative
  
  return {
    previousStock,
    newStock: this.stock,
    change: this.stock - previousStock,
    reason
  };
};

/**
 * Record a sale transaction
 * @description Increments sold count and revenue, then saves the document
 * @param {number} quantity - Quantity sold
 * @param {number} totalPrice - Total price of the sale
 * @returns {Promise<Object>} Saved product document
 */
productSchema.methods.recordSale = function(quantity, totalPrice) {
  this.totalSold += quantity;
  this.revenue += totalPrice;
  return this.save();
};

/**
 * Static Methods
 * @description Class-level methods for bulk operations and analytics
 */

/**
 * Get low stock products for a specific seller
 * @description Retrieves products that are below their low stock threshold
 * @param {string} sellerId - ID of the seller
 * @returns {Promise<Array>} Array of low stock products sorted by stock level
 */
productSchema.statics.getLowStockProducts = function(sellerId) {
  return this.find({
    sellerId,
    isActive: true,
    $expr: { $lte: ['$stock', '$lowStockAlert'] } // Stock <= lowStockAlert
  }).sort('stock');
};

/**
 * Get comprehensive seller product summary
 * @description Aggregates product statistics for a seller
 * @param {string} sellerId - ID of the seller
 * @returns {Promise<Object>} Object containing aggregated product statistics
 */
productSchema.statics.getSellerSummary = async function(sellerId) {
  const summary = await this.aggregate([
    // Match products for the specific seller
    { $match: { sellerId } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 }, // Count all products
        activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } }, // Count active products
        totalStock: { $sum: '$stock' }, // Sum of all stock
        totalSold: { $sum: '$totalSold' }, // Sum of all sales
        totalRevenue: { $sum: '$revenue' }, // Sum of all revenue
        lowStockProducts: {
          $sum: {
            $cond: [
              { $and: ['$isActive', { $lte: ['$stock', '$lowStockAlert'] }] },
              1, // Count if active and low stock
              0
            ]
          }
        },
        outOfStockProducts: {
          $sum: {
            $cond: [
              { $and: ['$isActive', { $eq: ['$stock', 0] }] },
              1, // Count if active and out of stock
              0
            ]
          }
        }
      }
    }
  ]);

  // Return summary or default values if no products found
  return summary[0] || {
    totalProducts: 0,
    activeProducts: 0,
    totalStock: 0,
    totalSold: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  };
};

/**
 * Output Transformation
 * @description Customizes JSON output format
 */
productSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id; // Convert _id to id for consistency
    delete ret._id; // Remove MongoDB's _id field
    return ret;
  },
  virtuals: true // Include virtual properties in output
});

// Create and export the model
const Product = mongoose.model('Product', productSchema);

module.exports = Product;