/**
 * Order Model
 * Defines the order schema with inventory management
 */

const mongoose = require('mongoose');

/**
 * Order Item Schema
 */
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    index: true
  },
  sellerId: {
    type: String,
    required: [true, 'Seller ID is required'],
    index: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required']
  },
  productImage: {
    type: String
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  // Inventory tracking
  reservedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['reserved', 'confirmed', 'cancelled', 'fulfilled'],
    default: 'reserved'
  }
}, {
  timestamps: true,
  _id: false
});

/**
 * Shipping Address Schema
 */
const shippingAddressSchema = new mongoose.Schema({
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: String,
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  contactName: String,
  contactPhone: String
}, {
  _id: false
});

/**
 * Order Schema Definition
 */
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  
  // Order totals
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Shipping details
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  
  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'],
    default: 'pending',
    index: true
  },
  
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['cod', 'online', 'wallet'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Fulfillment tracking
  sellerStatuses: [{
    sellerId: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  
  // Timestamps
  placedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Additional info
  notes: String,
  cancelReason: String,
  
  // Inventory tracking
  reservationExpiry: {
    type: Date,
    default: function() {
      // Reserve items for 30 minutes
      return new Date(Date.now() + 30 * 60 * 1000);
    },
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Generate order number before saving
 */
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  next();
});

/**
 * Method to calculate totals
 */
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((total, item) => total + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.tax + this.shippingFee;
  return this;
};

/**
 * Method to group items by seller
 */
orderSchema.methods.getSellerGroups = function() {
  const sellerGroups = {};
  
  this.items.forEach(item => {
    if (!sellerGroups[item.sellerId]) {
      sellerGroups[item.sellerId] = {
        sellerId: item.sellerId,
        items: [],
        totalItems: 0,
        totalAmount: 0
      };
    }
    
    sellerGroups[item.sellerId].items.push(item);
    sellerGroups[item.sellerId].totalItems += item.quantity;
    sellerGroups[item.sellerId].totalAmount += item.totalPrice;
  });
  
  return Object.values(sellerGroups);
};

/**
 * Method to update seller status
 */
orderSchema.methods.updateSellerStatus = function(sellerId, status, notes = '') {
  let sellerStatus = this.sellerStatuses.find(s => s.sellerId === sellerId);
  
  if (!sellerStatus) {
    sellerStatus = {
      sellerId,
      status,
      notes,
      updatedAt: new Date()
    };
    this.sellerStatuses.push(sellerStatus);
  } else {
    sellerStatus.status = status;
    sellerStatus.notes = notes;
    sellerStatus.updatedAt = new Date();
  }
  
  // Update overall order status based on seller statuses
  this.updateOverallStatus();
  
  return this.save();
};

/**
 * Method to update overall order status
 */
orderSchema.methods.updateOverallStatus = function() {
  const sellerStatuses = this.sellerStatuses.map(s => s.status);
  
  if (sellerStatuses.every(s => s === 'delivered')) {
    this.status = 'delivered';
    this.deliveredAt = new Date();
  } else if (sellerStatuses.every(s => s === 'shipped')) {
    this.status = 'shipped';
    this.shippedAt = new Date();
  } else if (sellerStatuses.some(s => s === 'processing')) {
    this.status = 'processing';
  } else if (sellerStatuses.every(s => s === 'accepted')) {
    this.status = 'confirmed';
    this.confirmedAt = new Date();
  } else if (sellerStatuses.every(s => s === 'cancelled')) {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
  }
};

/**
 * Method to cancel order
 */
orderSchema.methods.cancelOrder = function(reason = '') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  
  // Cancel all items
  this.items.forEach(item => {
    item.status = 'cancelled';
  });
  
  // Update seller statuses
  this.sellerStatuses.forEach(sellerStatus => {
    if (['pending', 'accepted'].includes(sellerStatus.status)) {
      sellerStatus.status = 'cancelled';
      sellerStatus.updatedAt = new Date();
    }
  });
  
  return this.save();
};

/**
 * Method to check if order reservation is expired
 */
orderSchema.methods.isReservationExpired = function() {
  return this.reservationExpiry < new Date();
};

/**
 * Static method to find expired reservations
 */
orderSchema.statics.findExpiredReservations = function() {
  return this.find({
    status: 'pending',
    reservationExpiry: { $lt: new Date() }
  });
};

/**
 * Transform output
 */
orderSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

// Create and export the model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;