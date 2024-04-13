/**
 * Product History Model
 * Tracks sales, stock changes, and other product activities
 */

const mongoose = require('mongoose');

const productHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Product'
  },
  type: {
    type: String,
    enum: ['sale', 'stock_add', 'stock_reduce', 'price_change', 'status_change'],
    required: true,
    index: true
  },
  orderId: String, // For sale type
  customerId: String, // For sale type
  quantity: Number, // For sale/stock changes
  previousStock: Number,
  newStock: Number,
  previousPrice: Number,
  newPrice: Number,
  previousStatus: String,
  newStatus: String,
  notes: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
productHistorySchema.index({ productId: 1, createdAt: -1 });
productHistorySchema.index({ type: 1, createdAt: -1 });
productHistorySchema.index({ orderId: 1 });
productHistorySchema.index({ customerId: 1 });

// Static method to get product history summary
productHistorySchema.statics.getProductSummary = async function(productId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const summary = await this.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  return summary;
};

// Static method to get sales analytics
productHistorySchema.statics.getSalesAnalytics = async function(sellerId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const analytics = await this.aggregate([
    {
      $match: {
        type: 'sale',
        createdAt: { $gte: startDate }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    { $match: { 'product.sellerId': sellerId } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        totalSales: { $sum: '$quantity' },
        totalRevenue: { $sum: { $multiply: ['$quantity', '$product.price'] } },
        orderCount: { $addToSet: '$orderId' }
      }
    },
    {
      $project: {
        date: '$_id.date',
        totalSales: 1,
        totalRevenue: 1,
        orderCount: { $size: '$orderCount' },
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);

  return analytics;
};

// Transform output
productHistorySchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('ProductHistory', productHistorySchema);