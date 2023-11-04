/**
 * Address Model
 * Defines the address schema for customer addresses
 */

const mongoose = require('mongoose');

/**
 * Address Schema Definition
 */
const addressSchema = new mongoose.Schema({
  // Reference to Customer
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required'],
    index: true
  },
  
  // Address Type
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  
  // Address Details
  addressLine1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true,
    maxlength: [100, 'Address line 1 cannot exceed 100 characters']
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: [100, 'Address line 2 cannot exceed 100 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City cannot exceed 50 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State cannot exceed 50 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [50, 'Country cannot exceed 50 characters']
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
    match: [/^[A-Za-z0-9\s-]{3,10}$/, 'Please provide a valid postal code']
  },
  
  // Contact Information
  contactName: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact name cannot exceed 100 characters']
  },
  contactPhone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number']
  },
  
  // Location Coordinates
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  
  // Flags
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Additional Information
  landmark: {
    type: String,
    trim: true,
    maxlength: [100, 'Landmark cannot exceed 100 characters']
  },
  deliveryInstructions: {
    type: String,
    maxlength: [500, 'Delivery instructions cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Indexes for better query performance
 */
addressSchema.index({ customerId: 1, isDefault: 1 });
addressSchema.index({ customerId: 1, isActive: 1 });

/**
 * Virtual property for full address
 */
addressSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.addressLine1,
    this.addressLine2,
    this.city,
    this.state,
    this.country,
    this.postalCode
  ].filter(Boolean);
  
  return parts.join(', ');
});

/**
 * Pre-save middleware to ensure only one default address per customer
 */
addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Remove default flag from other addresses
    await this.constructor.updateMany(
      { 
        customerId: this.customerId,
        _id: { $ne: this._id }
      },
      { $set: { isDefault: false } }
    );
  }
  next();
});

/**
 * Transform output
 */
addressSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
  virtuals: true
});

// Create and export the model
const Address = mongoose.model('Address', addressSchema);

module.exports = Address;