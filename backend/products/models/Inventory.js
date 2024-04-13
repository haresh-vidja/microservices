/**
 * Inventory Model - Moved to Products Service
 * Manages product inventory with reservation system
 */

const mongoose = require('mongoose');

/**
 * Inventory Schema Definition
 */
const inventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Product ID is required'],
    unique: true,
    index: true,
    ref: 'Product'
  },
  sellerId: {
    type: String,
    required: [true, 'Seller ID is required'],
    index: true
  },
  
  // Stock levels
  totalStock: {
    type: Number,
    required: [true, 'Total stock is required'],
    min: [0, 'Total stock cannot be negative'],
    default: 0
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: [0, 'Reserved stock cannot be negative']
  },
  soldStock: {
    type: Number,
    default: 0,
    min: [0, 'Sold stock cannot be negative']
  },
  
  // Calculated fields
  availableStock: {
    type: Number,
    default: 0,
    min: [0, 'Available stock cannot be negative']
  },
  
  // Stock tracking
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  
  // Status flags
  isOutOfStock: {
    type: Boolean,
    default: false,
    index: true
  },
  isLowStock: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Reservation tracking
  reservations: [{
    orderId: {
      type: String,
      required: true
    },
    customerId: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    reservedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'confirmed', 'expired', 'cancelled'],
      default: 'active'
    }
  }],
  
  // Stock movement history
  movements: [{
    type: {
      type: String,
      enum: ['in', 'out', 'reserved', 'released', 'sold', 'adjusted', 'returned'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: String,
    orderId: String,
    customerId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    previousStock: Number,
    newStock: Number
  }]
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Calculate available stock before saving
 */
inventorySchema.pre('save', function(next) {
  this.availableStock = Math.max(0, this.totalStock - this.reservedStock - this.soldStock);
  this.isOutOfStock = this.availableStock === 0;
  this.isLowStock = this.availableStock > 0 && this.availableStock <= this.lowStockThreshold;
  next();
});

/**
 * Method to reserve stock for cart/checkout process
 */
inventorySchema.methods.reserveStock = function(orderId, customerId, quantity, expirationMinutes = 30) {
  if (quantity > this.availableStock) {
    throw new Error(`Insufficient stock. Available: ${this.availableStock}, Requested: ${quantity}`);
  }
  
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
  
  // Add reservation
  this.reservations.push({
    orderId,
    customerId,
    quantity,
    expiresAt,
    status: 'active'
  });
  
  const previousReserved = this.reservedStock;
  
  // Update reserved stock
  this.reservedStock += quantity;
  
  // Add movement record
  this.movements.push({
    type: 'reserved',
    quantity: -quantity,
    reason: 'Stock reserved for order',
    orderId,
    customerId,
    notes: `Reserved ${quantity} units for order ${orderId}`,
    previousStock: previousReserved,
    newStock: this.reservedStock
  });
  
  return this.save();
};

/**
 * Method to confirm reservation (convert to sold)
 */
inventorySchema.methods.confirmReservation = function(orderId) {
  const reservation = this.reservations.find(r => 
    r.orderId === orderId && r.status === 'active'
  );
  
  if (!reservation) {
    throw new Error('Reservation not found or already processed');
  }
  
  // Update reservation status
  reservation.status = 'confirmed';
  
  const previousReserved = this.reservedStock;
  const previousSold = this.soldStock;
  
  // Move from reserved to sold
  this.reservedStock -= reservation.quantity;
  this.soldStock += reservation.quantity;
  
  // Add movement record
  this.movements.push({
    type: 'sold',
    quantity: -reservation.quantity,
    reason: 'Order confirmed and fulfilled',
    orderId,
    customerId: reservation.customerId,
    notes: `Order ${orderId} confirmed - ${reservation.quantity} units sold`,
    previousStock: previousSold,
    newStock: this.soldStock
  });
  
  return this.save();
};

/**
 * Method to release reservation (cancel order/timeout)
 */
inventorySchema.methods.releaseReservation = function(orderId, reason = 'Order cancelled') {
  const reservation = this.reservations.find(r => 
    r.orderId === orderId && r.status === 'active'
  );
  
  if (!reservation) {
    throw new Error('Active reservation not found');
  }
  
  // Update reservation status
  reservation.status = reason.includes('expired') ? 'expired' : 'cancelled';
  
  const previousReserved = this.reservedStock;
  
  // Release reserved stock
  this.reservedStock -= reservation.quantity;
  
  // Add movement record
  this.movements.push({
    type: 'released',
    quantity: reservation.quantity,
    reason,
    orderId,
    customerId: reservation.customerId,
    notes: `Reservation released: ${reason}`,
    previousStock: previousReserved,
    newStock: this.reservedStock
  });
  
  return this.save();
};

/**
 * Method to add stock (restock)
 */
inventorySchema.methods.addStock = function(quantity, reason = 'Stock replenishment', notes = '') {
  const previousTotal = this.totalStock;
  this.totalStock += quantity;
  
  // Add movement record
  this.movements.push({
    type: 'in',
    quantity,
    reason,
    notes,
    previousStock: previousTotal,
    newStock: this.totalStock
  });
  
  return this.save();
};

/**
 * Method to adjust stock (manual correction)
 */
inventorySchema.methods.adjustStock = function(newTotal, reason = 'Stock adjustment', notes = '') {
  const difference = newTotal - this.totalStock;
  const previousTotal = this.totalStock;
  this.totalStock = newTotal;
  
  // Add movement record
  this.movements.push({
    type: 'adjusted',
    quantity: difference,
    reason,
    notes,
    previousStock: previousTotal,
    newStock: this.totalStock
  });
  
  return this.save();
};

/**
 * Method to handle returns
 */
inventorySchema.methods.processReturn = function(orderId, quantity, reason = 'Product return') {
  const previousSold = this.soldStock;
  const previousTotal = this.totalStock;
  
  // Return stock from sold back to total
  this.soldStock -= quantity;
  this.totalStock += quantity;
  
  // Add movement record
  this.movements.push({
    type: 'returned',
    quantity,
    reason,
    orderId,
    notes: `${quantity} units returned from order ${orderId}`,
    previousStock: previousSold,
    newStock: this.soldStock
  });
  
  return this.save();
};

/**
 * Method to get stock summary
 */
inventorySchema.methods.getStockSummary = function() {
  return {
    productId: this.productId,
    sellerId: this.sellerId,
    totalStock: this.totalStock,
    reservedStock: this.reservedStock,
    soldStock: this.soldStock,
    availableStock: this.availableStock,
    isOutOfStock: this.isOutOfStock,
    isLowStock: this.isLowStock,
    lowStockThreshold: this.lowStockThreshold,
    activeReservations: this.reservations.filter(r => r.status === 'active').length,
    expiredReservations: this.reservations.filter(r => r.status === 'expired').length,
    lastUpdated: this.updatedAt
  };
};

/**
 * Method to get reservation details
 */
inventorySchema.methods.getReservations = function(status = null) {
  let reservations = this.reservations;
  
  if (status) {
    reservations = reservations.filter(r => r.status === status);
  }
  
  return reservations.map(r => ({
    orderId: r.orderId,
    customerId: r.customerId,
    quantity: r.quantity,
    reservedAt: r.reservedAt,
    expiresAt: r.expiresAt,
    status: r.status,
    isExpired: r.expiresAt < new Date()
  }));
};

/**
 * Static method to clean expired reservations
 */
inventorySchema.statics.cleanExpiredReservations = async function() {
  const expiredReservations = await this.find({
    'reservations.status': 'active',
    'reservations.expiresAt': { $lt: new Date() }
  });
  
  let cleanedCount = 0;
  
  for (const inventory of expiredReservations) {
    for (const reservation of inventory.reservations) {
      if (reservation.status === 'active' && reservation.expiresAt < new Date()) {
        // Mark reservation as expired
        reservation.status = 'expired';
        
        const previousReserved = inventory.reservedStock;
        
        // Release reserved stock
        inventory.reservedStock -= reservation.quantity;
        
        // Add movement record
        inventory.movements.push({
          type: 'released',
          quantity: reservation.quantity,
          reason: 'Reservation expired',
          orderId: reservation.orderId,
          customerId: reservation.customerId,
          notes: 'Automatically released expired reservation',
          previousStock: previousReserved,
          newStock: inventory.reservedStock
        });
        
        cleanedCount++;
      }
    }
    
    await inventory.save();
  }
  
  return cleanedCount;
};

/**
 * Static method to get low stock products
 */
inventorySchema.statics.getLowStockProducts = function(sellerId = null) {
  const query = {
    isLowStock: true,
    isActive: true
  };
  
  if (sellerId) {
    query.sellerId = sellerId;
  }
  
  return this.find(query).populate('productId').sort('availableStock');
};

/**
 * Static method to get inventory by product IDs
 */
inventorySchema.statics.getByProductIds = function(productIds) {
  return this.find({
    productId: { $in: productIds },
    isActive: true
  });
};

/**
 * Transform output
 */
inventorySchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

// Create and export the model
const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;