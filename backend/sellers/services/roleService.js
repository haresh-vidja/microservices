/**
 * Role Service Layer
 * Contains business logic for role management operations
 */

const Role = require('../models/Role');
const Seller = require('../models/Seller');
const logger = require('../utils/logger');

class RoleService {
  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @param {Object} currentSeller - Current authenticated seller
   * @returns {Object} Created role
   */
  async createRole(roleData, currentSeller) {
    try {
      // Check if role already exists
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (existingRole) {
        throw new Error('Role with this name already exists');
      }

      // Create new role
      const role = new Role({
        ...roleData,
        createdBy: currentSeller.id
      });

      await role.save();

      logger.info(`Role created by ${currentSeller.email}: ${role.name}`);

      return role.toJSON();
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Get all roles
   * @param {Object} query - Query parameters
   * @returns {Object} List of roles
   */
  async getAllRoles(query = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt', ...filters } = query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort
      };

      const roles = await Role.find(filters)
        .populate('createdBy', 'firstName lastName email')
        .sort(options.sort)
        .limit(options.limit)
        .skip((options.page - 1) * options.limit);

      const total = await Role.countDocuments(filters);

      return {
        roles,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching roles:', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   * @param {String} roleId - Role ID
   * @returns {Object} Role details
   */
  async getRoleById(roleId) {
    try {
      const role = await Role.findById(roleId)
        .populate('createdBy', 'firstName lastName email');

      if (!role) {
        throw new Error('Role not found');
      }

      return role.toJSON();
    } catch (error) {
      logger.error('Error fetching role:', error);
      throw error;
    }
  }

  /**
   * Update role
   * @param {String} roleId - Role ID
   * @param {Object} updateData - Data to update
   * @param {Object} currentSeller - Current authenticated seller
   * @returns {Object} Updated role
   */
  async updateRole(roleId, updateData, currentSeller) {
    try {
      // Prevent updating certain fields
      delete updateData.createdBy;
      delete updateData.isDefault;

      const role = await Role.findById(roleId);
      
      if (!role) {
        throw new Error('Role not found');
      }

      // Prevent updating default roles except by super-admin
      if (role.isDefault && currentSeller.role.name !== 'super-admin') {
        throw new Error('Cannot modify default roles');
      }

      const updatedRole = await Role.findByIdAndUpdate(
        roleId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      logger.info(`Role updated by ${currentSeller.email}: ${updatedRole.name}`);

      return updatedRole.toJSON();
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   * @param {String} roleId - Role ID
   * @param {Object} currentSeller - Current authenticated seller
   * @returns {Object} Success message
   */
  async deleteRole(roleId, currentSeller) {
    try {
      const role = await Role.findById(roleId);
      
      if (!role) {
        throw new Error('Role not found');
      }

      // Prevent deleting default roles
      if (role.isDefault) {
        throw new Error('Cannot delete default roles');
      }

      // Check if any sellers are using this role
      const sellersUsingRole = await Seller.countDocuments({ role: roleId });
      
      if (sellersUsingRole > 0) {
        throw new Error(`Cannot delete role. ${sellersUsingRole} sellers are using this role`);
      }

      await Role.findByIdAndDelete(roleId);

      logger.info(`Role deleted by ${currentSeller.email}: ${role.name}`);

      return {
        message: 'Role deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Assign role to seller
   * @param {String} sellerId - Seller ID
   * @param {String} roleId - Role ID
   * @param {Object} currentSeller - Current authenticated seller
   * @returns {Object} Updated seller
   */
  async assignRole(sellerId, roleId, currentSeller) {
    try {
      const [seller, role] = await Promise.all([
        Seller.findById(sellerId),
        Role.findById(roleId)
      ]);

      if (!seller) {
        throw new Error('Seller not found');
      }

      if (!role) {
        throw new Error('Role not found');
      }

      if (!role.isActive) {
        throw new Error('Cannot assign inactive role');
      }

      // Check if current seller has sufficient role level to assign this role
      if (currentSeller.role.level <= role.level && currentSeller.role.name !== 'super-admin') {
        throw new Error('Insufficient permissions to assign this role');
      }

      seller.role = roleId;
      await seller.save();

      const updatedSeller = await Seller.findById(sellerId)
        .populate('role', 'name level permissions');

      logger.info(`Role assigned by ${currentSeller.email}: ${role.name} to ${seller.email}`);

      return updatedSeller.toJSON();
    } catch (error) {
      logger.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Get available permissions list
   * @returns {Array} List of all available permissions
   */
  getAvailablePermissions() {
    return [
      { key: 'manage-user', description: 'Manage users' },
      { key: 'add-user', description: 'Add new users' },
      { key: 'edit-user', description: 'Edit user profiles' },
      { key: 'delete-user', description: 'Delete users' },
      { key: 'view-user', description: 'View user profiles' },
      { key: 'manage-product', description: 'Manage products' },
      { key: 'add-product', description: 'Add new products' },
      { key: 'edit-product', description: 'Edit products' },
      { key: 'delete-product', description: 'Delete products' },
      { key: 'view-product', description: 'View products' },
      { key: 'manage-order', description: 'Manage orders' },
      { key: 'view-order', description: 'View orders' },
      { key: 'update-order-status', description: 'Update order status' },
      { key: 'view-analytics', description: 'View analytics' },
      { key: 'view-reports', description: 'View reports' },
      { key: 'export-data', description: 'Export data' },
      { key: 'manage-business', description: 'Manage business profiles' },
      { key: 'update-business-profile', description: 'Update business profile' },
      { key: 'upload-media', description: 'Upload media files' },
      { key: 'manage-media', description: 'Manage media files' },
      { key: 'manage-role', description: 'Manage roles' },
      { key: 'assign-role', description: 'Assign roles to users' },
      { key: 'manage-settings', description: 'Manage system settings' }
    ];
  }
}

module.exports = new RoleService();