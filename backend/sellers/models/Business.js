/**
 * Business Model
 * Defines the business profile schema for sellers
 */

const mongoose = require('mongoose');

/**
 * Business Schema Definition
 */
const businessSchema = new mongoose.Schema({
  // Owner Reference
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: [true, 'Seller ID is required'],
    unique: true,
    index: true
  },
  
  // Basic Business Information
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  legalName: {
    type: String,
    trim: true,
    maxlength: [100, 'Legal name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    enum: ['individual', 'partnership', 'llc', 'corporation', 'other']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'Business email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Business phone is required'],
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+\..+/, 'Please provide a valid website URL']
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [100, 'Street cannot exceed 100 characters']
    },
    street2: {
      type: String,
      trim: true,
      maxlength: [100, 'Street 2 cannot exceed 100 characters']
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
    }
  },
  
  // Business Details
  logoMediaId: {
    type: String,
    trim: true,
    default: null
  },
  industry: {
    type: String,
    trim: true,
    maxlength: [100, 'Industry cannot exceed 100 characters']
  },
  categories: [{
    type: String,
    trim: true
  }],
  establishedDate: {
    type: Date
  },
  employeeCount: {
    type: Number,
    min: 1
  },
  
  // Tax Information
  taxId: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values but unique non-null values
  },
  vatNumber: {
    type: String,
    trim: true,
    sparse: true
  },
  
  // Bank Information
  bankInfo: {
    accountName: {
      type: String,
      trim: true,
      maxlength: [100, 'Account name cannot exceed 100 characters']
    },
    accountNumber: {
      type: String,
      trim: true,
      select: false // Don't return by default for security
    },
    routingNumber: {
      type: String,
      trim: true,
      select: false // Don't return by default for security
    },
    bankName: {
      type: String,
      trim: true,
      maxlength: [100, 'Bank name cannot exceed 100 characters']
    }
  },
  
  // Social Media
  socialMedia: {
    facebook: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?facebook\.com\/.+/, 'Please provide a valid Facebook URL']
    },
    instagram: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?instagram\.com\/.+/, 'Please provide a valid Instagram URL']
    },
    twitter: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?twitter\.com\/.+/, 'Please provide a valid Twitter URL']
    },
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.+/, 'Please provide a valid LinkedIn URL']
    }
  },
  
  // Business Hours
  businessHours: {
    monday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    tuesday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    wednesday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    thursday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    friday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    saturday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    sunday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    }
  },
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'in_review', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedAt: {
    type: Date
  },
  verificationNotes: {
    type: String,
    maxlength: [500, 'Verification notes cannot exceed 500 characters']
  },
  
  // Media
  logo: {
    type: String
  },
  coverImage: {
    type: String
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metrics
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  metrics: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalProducts: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Indexes for better query performance
 */
businessSchema.index({ sellerId: 1 });
businessSchema.index({ businessName: 1 });
businessSchema.index({ verificationStatus: 1 });
businessSchema.index({ isActive: 1 });
businessSchema.index({ 'address.city': 1 });
businessSchema.index({ 'address.state': 1 });
businessSchema.index({ categories: 1 });

/**
 * Virtual property for full address
 */
businessSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, street2, city, state, country, postalCode } = this.address;
  const parts = [street, street2, city, state, country, postalCode].filter(Boolean);
  return parts.join(', ');
});

/**
 * Method to check if business is verified
 */
businessSchema.methods.isVerified = function() {
  return this.verificationStatus === 'verified';
};

/**
 * Method to update business metrics
 */
businessSchema.methods.updateMetrics = function(orderValue) {
  this.metrics.totalOrders += 1;
  this.metrics.totalRevenue += orderValue;
  return this.save();
};

/**
 * Transform output
 */
businessSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    // Remove sensitive bank information
    if (ret.bankInfo) {
      delete ret.bankInfo.accountNumber;
      delete ret.bankInfo.routingNumber;
    }
    return ret;
  },
  virtuals: true
});

// Create and export the model
const Business = mongoose.model('Business', businessSchema);

module.exports = Business;