/**
 * Product Model
 * Enhanced product schema with management features
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  images: [{
    media_id: {
      type: String,
      required: false, // Made optional to handle legacy data
      validate: {
        validator: function(v) {
          // Only validate format if media_id is provided
          return !v || /^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i.test(v);
        },
        message: 'Invalid media ID format'
      }
    },
    isPrimary: { type: Boolean, default: false },
    url: { type: String } // Support for legacy URL format
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  lowStockAlert: {
    type: Number,
    default: 5,
    min: 0
  },
  totalSold: {
    type: Number,
    default: 0,
    min: 0
  },
  revenue: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  specifications: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
productSchema.index({ sellerId: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ createdAt: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ revenue: -1 });

// Virtual for getting primary image
productSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg || this.images[0];
});

// Method to check if product is low in stock
productSchema.methods.isLowStock = function() {
  return this.stock <= this.lowStockAlert;
};

// Method to check if product is out of stock
productSchema.methods.isOutOfStock = function() {
  return this.stock === 0;
};

// Method to update stock
productSchema.methods.updateStock = function(newStock, reason = 'Stock update') {
  const previousStock = this.stock;
  this.stock = Math.max(0, newStock);
  
  return {
    previousStock,
    newStock: this.stock,
    change: this.stock - previousStock,
    reason
  };
};

// Method to increment sold count and revenue
productSchema.methods.recordSale = function(quantity, totalPrice) {
  this.totalSold += quantity;
  this.revenue += totalPrice;
  return this.save();
};

// Static method to get low stock products for a seller
productSchema.statics.getLowStockProducts = function(sellerId) {
  return this.find({
    sellerId,
    isActive: true,
    $expr: { $lte: ['$stock', '$lowStockAlert'] }
  }).sort('stock');
};

// Static method to get seller's product summary
productSchema.statics.getSellerSummary = async function(sellerId) {
  const summary = await this.aggregate([
    { $match: { sellerId } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalStock: { $sum: '$stock' },
        totalSold: { $sum: '$totalSold' },
        totalRevenue: { $sum: '$revenue' },
        lowStockProducts: {
          $sum: {
            $cond: [
              { $and: ['$isActive', { $lte: ['$stock', '$lowStockAlert'] }] },
              1,
              0
            ]
          }
        },
        outOfStockProducts: {
          $sum: {
            $cond: [
              { $and: ['$isActive', { $eq: ['$stock', 0] }] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

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

// Transform output
productSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
  virtuals: true
});

module.exports = mongoose.model('Product', productSchema);