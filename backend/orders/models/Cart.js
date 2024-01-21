/**
 * Cart Model
 * Defines the cart schema for customer shopping cart
 */

const mongoose = require('mongoose');

/**
 * Cart Item Schema
 */
const cartItemSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  // Cached product details for quick access
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String
  },
  availableStock: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true,
  _id: false
});

/**
 * Cart Schema Definition
 */
const cartSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Calculate cart totals before saving
 */
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  this.lastUpdated = Date.now();
  next();
});

/**
 * Method to add item to cart
 */
cartSchema.methods.addItem = function(itemData) {
  const existingItem = this.items.find(item => 
    item.productId === itemData.productId
  );

  if (existingItem) {
    existingItem.quantity += itemData.quantity;
    existingItem.price = itemData.price; // Update price in case it changed
    existingItem.availableStock = itemData.availableStock;
  } else {
    this.items.push(itemData);
  }

  return this.save();
};

/**
 * Method to update item quantity
 */
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const item = this.items.find(item => item.productId === productId);
  
  if (item) {
    if (quantity <= 0) {
      this.items = this.items.filter(item => item.productId !== productId);
    } else {
      item.quantity = quantity;
    }
    return this.save();
  }
  
  throw new Error('Item not found in cart');
};

/**
 * Method to remove item from cart
 */
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => item.productId !== productId);
  return this.save();
};

/**
 * Method to clear cart
 */
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

/**
 * Method to validate cart items availability
 */
cartSchema.methods.validateAvailability = async function() {
  const unavailableItems = [];
  
  for (const item of this.items) {
    if (item.quantity > item.availableStock) {
      unavailableItems.push({
        productId: item.productId,
        productName: item.productName,
        requestedQuantity: item.quantity,
        availableStock: item.availableStock
      });
    }
  }
  
  return unavailableItems;
};

/**
 * Method to get cart summary
 */
cartSchema.methods.getSummary = function() {
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
    sellerGroups[item.sellerId].totalAmount += (item.price * item.quantity);
  });
  
  return {
    totalItems: this.totalItems,
    totalAmount: this.totalAmount,
    sellerGroups: Object.values(sellerGroups)
  };
};

/**
 * Transform output
 */
cartSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

// Create and export the model
const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;