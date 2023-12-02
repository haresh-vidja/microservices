/**
 * Role Model
 * Defines the role schema with permissions for sellers
 */

const mongoose = require('mongoose');

/**
 * Role Schema Definition
 */
const roleSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  // Permissions
  permissions: {
    // User Management
    'manage-user': {
      type: Boolean,
      default: false
    },
    'add-user': {
      type: Boolean,
      default: false
    },
    'edit-user': {
      type: Boolean,
      default: false
    },
    'delete-user': {
      type: Boolean,
      default: false
    },
    'view-user': {
      type: Boolean,
      default: false
    },
    
    // Product Management
    'manage-product': {
      type: Boolean,
      default: false
    },
    'add-product': {
      type: Boolean,
      default: false
    },
    'edit-product': {
      type: Boolean,
      default: false
    },
    'delete-product': {
      type: Boolean,
      default: false
    },
    'view-product': {
      type: Boolean,
      default: false
    },
    
    // Order Management
    'manage-order': {
      type: Boolean,
      default: false
    },
    'view-order': {
      type: Boolean,
      default: false
    },
    'update-order-status': {
      type: Boolean,
      default: false
    },
    
    // Analytics and Reports
    'view-analytics': {
      type: Boolean,
      default: false
    },
    'view-reports': {
      type: Boolean,
      default: false
    },
    'export-data': {
      type: Boolean,
      default: false
    },
    
    // Business Management
    'manage-business': {
      type: Boolean,
      default: false
    },
    'update-business-profile': {
      type: Boolean,
      default: false
    },
    
    // Media Management
    'upload-media': {
      type: Boolean,
      default: false
    },
    'manage-media': {
      type: Boolean,
      default: false
    },
    
    // Role Management (Admin only)
    'manage-role': {
      type: Boolean,
      default: false
    },
    'assign-role': {
      type: Boolean,
      default: false
    },
    
    // System Settings
    'manage-settings': {
      type: Boolean,
      default: false
    }
  },
  
  // Role Level
  level: {
    type: Number,
    required: [true, 'Role level is required'],
    min: 1,
    max: 100
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Created by (Admin who created this role)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller'
  }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Indexes for better query performance
 */
roleSchema.index({ name: 1 });
roleSchema.index({ level: 1 });
roleSchema.index({ isActive: 1 });

/**
 * Static method to create default roles
 */
roleSchema.statics.createDefaultRoles = async function() {
  const defaultRoles = [
    {
      name: 'super-admin',
      description: 'Super administrator with all permissions',
      level: 100,
      isDefault: true,
      permissions: {
        'manage-user': true,
        'add-user': true,
        'edit-user': true,
        'delete-user': true,
        'view-user': true,
        'manage-product': true,
        'add-product': true,
        'edit-product': true,
        'delete-product': true,
        'view-product': true,
        'manage-order': true,
        'view-order': true,
        'update-order-status': true,
        'view-analytics': true,
        'view-reports': true,
        'export-data': true,
        'manage-business': true,
        'update-business-profile': true,
        'upload-media': true,
        'manage-media': true,
        'manage-role': true,
        'assign-role': true,
        'manage-settings': true
      }
    },
    {
      name: 'admin',
      description: 'Administrator with most permissions',
      level: 80,
      isDefault: true,
      permissions: {
        'manage-user': true,
        'add-user': true,
        'edit-user': true,
        'view-user': true,
        'manage-product': true,
        'add-product': true,
        'edit-product': true,
        'delete-product': true,
        'view-product': true,
        'manage-order': true,
        'view-order': true,
        'update-order-status': true,
        'view-analytics': true,
        'view-reports': true,
        'export-data': true,
        'manage-business': true,
        'update-business-profile': true,
        'upload-media': true,
        'manage-media': true
      }
    },
    {
      name: 'manager',
      description: 'Manager with product and order management',
      level: 60,
      isDefault: true,
      permissions: {
        'view-user': true,
        'manage-product': true,
        'add-product': true,
        'edit-product': true,
        'view-product': true,
        'manage-order': true,
        'view-order': true,
        'update-order-status': true,
        'view-analytics': true,
        'view-reports': true,
        'update-business-profile': true,
        'upload-media': true,
        'manage-media': true
      }
    },
    {
      name: 'seller',
      description: 'Basic seller with limited permissions',
      level: 40,
      isDefault: true,
      permissions: {
        'add-product': true,
        'edit-product': true,
        'view-product': true,
        'view-order': true,
        'update-order-status': true,
        'view-analytics': true,
        'update-business-profile': true,
        'upload-media': true
      }
    }
  ];

  for (const roleData of defaultRoles) {
    const existingRole = await this.findOne({ name: roleData.name });
    if (!existingRole) {
      await this.create(roleData);
    }
  }
};

/**
 * Method to check if role has specific permission
 */
roleSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] === true;
};

/**
 * Method to get all granted permissions
 */
roleSchema.methods.getGrantedPermissions = function() {
  const granted = [];
  for (const [permission, value] of Object.entries(this.permissions)) {
    if (value === true) {
      granted.push(permission);
    }
  }
  return granted;
};

/**
 * Transform output
 */
roleSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

// Create and export the model
const Role = mongoose.model('Role', roleSchema);

module.exports = Role;