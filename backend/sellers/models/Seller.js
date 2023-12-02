/**
 * Seller Model
 * Defines the seller schema for MongoDB using Mongoose
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * Seller Schema Definition
 */
const sellerSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number']
  },
  
  // Business Information
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    enum: ['individual', 'partnership', 'llc', 'corporation', 'other']
  },
  businessDescription: {
    type: String,
    maxlength: [500, 'Business description cannot exceed 500 characters']
  },
  
  // Contact Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [100, 'Street cannot exceed 100 characters']
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
  
  // Profile Information
  profileImage: {
    type: String
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  
  // Business Verification
  businessDocuments: [{
    type: {
      type: String,
      enum: ['tax_id', 'business_license', 'bank_statement', 'other']
    },
    url: String,
    verified: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Role and Access
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'Role is required']
  },
  
  // Authentication Tokens
  refreshToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // Tracking
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  
  // Business Metrics
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalProducts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  versionKey: false
});

/**
 * Indexes for better query performance
 */
sellerSchema.index({ email: 1 });
sellerSchema.index({ phone: 1 });
sellerSchema.index({ businessName: 1 });
sellerSchema.index({ role: 1 });
sellerSchema.index({ isActive: 1 });
sellerSchema.index({ createdAt: -1 });

/**
 * Virtual property for full name
 */
sellerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Virtual property for full address
 */
sellerSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, country, postalCode } = this.address;
  return `${street}, ${city}, ${state}, ${country} ${postalCode}`;
});

/**
 * Pre-save middleware to hash password
 */
sellerSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password for login
 */
sellerSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

/**
 * Method to check if account is locked
 */
sellerSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Method to increment login attempts
 */
sellerSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

/**
 * Method to reset login attempts
 */
sellerSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

/**
 * Transform output
 */
sellerSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.password;
    delete ret.refreshToken;
    delete ret.verificationToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  },
  virtuals: true
});

// Create and export the model
const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;