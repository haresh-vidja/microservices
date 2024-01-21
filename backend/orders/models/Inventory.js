/**
 * Inventory Model
 * Manages product inventory with reservation system
 */

const mongoose = require('mongoose');

/**
 * Inventory Schema Definition
 */
const inventorySchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    unique: true,
    index: true
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
      enum: ['in', 'out', 'reserved', 'released', 'sold', 'adjusted'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: String,
    orderId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
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
 * Method to reserve stock
 */
inventorySchema.methods.reserveStock = function(orderId, quantity, expirationMinutes = 30) {
  if (quantity > this.availableStock) {
    throw new Error(`Insufficient stock. Available: ${this.availableStock}, Requested: ${quantity}`);
  }
  
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
  
  // Add reservation
  this.reservations.push({
    orderId,
    quantity,
    expiresAt,
    status: 'active'
  });
  
  // Update reserved stock
  this.reservedStock += quantity;
  
  // Add movement record
  this.movements.push({
    type: 'reserved',
    quantity: -quantity,
    reason: 'Order reservation',
    orderId,
    notes: `Reserved for order ${orderId}`
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
  
  // Move from reserved to sold
  this.reservedStock -= reservation.quantity;
  this.soldStock += reservation.quantity;
  
  // Add movement record
  this.movements.push({
    type: 'sold',
    quantity: -reservation.quantity,
    reason: 'Order confirmed',
    orderId,
    notes: `Order ${orderId} confirmed and fulfilled`
  });
  
  return this.save();
};

/**
 * Method to release reservation
 */
inventorySchema.methods.releaseReservation = function(orderId, reason = 'Order cancelled') {
  const reservation = this.reservations.find(r => 
    r.orderId === orderId && r.status === 'active'
  );
  
  if (!reservation) {
    throw new Error('Active reservation not found');
  }
  
  // Update reservation status
  reservation.status = 'cancelled';
  
  // Release reserved stock
  this.reservedStock -= reservation.quantity;
  
  // Add movement record
  this.movements.push({
    type: 'released',
    quantity: reservation.quantity,
    reason,
    orderId,
    notes: `Reservation released: ${reason}`
  });
  
  return this.save();
};

/**
 * Method to add stock
 */
inventorySchema.methods.addStock = function(quantity, reason = 'Stock replenishment', notes = '') {
  this.totalStock += quantity;
  
  // Add movement record
  this.movements.push({
    type: 'in',
    quantity,
    reason,
    notes
  });
  
  return this.save();
};

/**
 * Method to adjust stock
 */
inventorySchema.methods.adjustStock = function(newTotal, reason = 'Stock adjustment', notes = '') {
  const difference = newTotal - this.totalStock;
  this.totalStock = newTotal;
  
  // Add movement record
  this.movements.push({
    type: 'adjusted',
    quantity: difference,
    reason,
    notes
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
    activeReservations: this.reservations.filter(r => r.status === 'active').length,
    lastUpdated: this.updatedAt
  };
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
        
        // Release reserved stock
        inventory.reservedStock -= reservation.quantity;
        
        // Add movement record
        inventory.movements.push({
          type: 'released',
          quantity: reservation.quantity,
          reason: 'Reservation expired',
          orderId: reservation.orderId,
          notes: 'Automatically released expired reservation'
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
  
  return this.find(query).sort('availableStock');
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