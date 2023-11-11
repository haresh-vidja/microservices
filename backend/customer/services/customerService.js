/**
 * Customer Service Layer
 * Contains business logic for customer operations
 */

const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

class CustomerService {
  /**
   * Register a new customer
   * @param {Object} userData - Customer registration data
   * @returns {Object} Created customer and token
   */
  async signUp(userData) {
    try {
      // Check if customer already exists
      const existingCustomer = await Customer.findOne({ 
        email: userData.email 
      });
      
      if (existingCustomer) {
        throw new Error('Customer with this email already exists');
      }

      // Create new customer
      const customer = new Customer(userData);
      await customer.save();

      // Generate JWT token
      const token = this.generateToken(customer);
      
      // Generate refresh token
      const refreshToken = this.generateRefreshToken(customer);
      
      // Save refresh token to database
      customer.refreshToken = refreshToken;
      await customer.save();

      logger.info(`New customer registered: ${customer.email}`);

      return {
        customer: customer.toJSON(),
        token,
        refreshToken
      };
    } catch (error) {
      logger.error('Error in customer signup:', error);
      throw error;
    }
  }

  /**
   * Authenticate customer
   * @param {Object} credentials - Email and password
   * @returns {Object} Customer data and token
   */
  async signIn(credentials) {
    try {
      const { email, password } = credentials;

      // Find customer with password field
      const customer = await Customer.findOne({ email }).select('+password +loginAttempts +lockUntil');
      
      if (!customer) {
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (customer.isLocked()) {
        throw new Error('Account is locked due to too many failed login attempts');
      }

      // Check if account is active
      if (!customer.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await customer.comparePassword(password);
      
      if (!isPasswordValid) {
        await customer.incLoginAttempts();
        throw new Error('Invalid email or password');
      }

      // Reset login attempts
      await customer.resetLoginAttempts();

      // Generate tokens
      const token = this.generateToken(customer);
      const refreshToken = this.generateRefreshToken(customer);
      
      // Update refresh token
      customer.refreshToken = refreshToken;
      await customer.save();

      logger.info(`Customer logged in: ${customer.email}`);

      return {
        customer: customer.toJSON(),
        token,
        refreshToken
      };
    } catch (error) {
      logger.error('Error in customer signin:', error);
      throw error;
    }
  }

  /**
   * Get customer profile
   * @param {String} customerId - Customer ID
   * @returns {Object} Customer profile
   */
  async getProfile(customerId) {
    try {
      const customer = await Customer.findById(customerId);
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      return customer.toJSON();
    } catch (error) {
      logger.error('Error fetching customer profile:', error);
      throw error;
    }
  }

  /**
   * Update customer profile
   * @param {String} customerId - Customer ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated customer profile
   */
  async updateProfile(customerId, updateData) {
    try {
      // Prevent updating sensitive fields
      delete updateData.password;
      delete updateData.email;
      delete updateData.refreshToken;
      delete updateData.isVerified;

      const customer = await Customer.findByIdAndUpdate(
        customerId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!customer) {
        throw new Error('Customer not found');
      }

      logger.info(`Customer profile updated: ${customer.email}`);

      return customer.toJSON();
    } catch (error) {
      logger.error('Error updating customer profile:', error);
      throw error;
    }
  }

  /**
   * Change customer password
   * @param {String} customerId - Customer ID
   * @param {Object} passwordData - Current and new password
   * @returns {Object} Success message
   */
  async changePassword(customerId, passwordData) {
    try {
      const { currentPassword, newPassword } = passwordData;

      const customer = await Customer.findById(customerId).select('+password');
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Verify current password
      const isPasswordValid = await customer.comparePassword(currentPassword);
      
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      customer.password = newPassword;
      await customer.save();

      logger.info(`Password changed for customer: ${customer.email}`);

      return {
        message: 'Password changed successfully'
      };
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Delete customer account
   * @param {String} customerId - Customer ID
   * @returns {Object} Success message
   */
  async deleteAccount(customerId) {
    try {
      const customer = await Customer.findByIdAndUpdate(
        customerId,
        { 
          $set: { 
            isActive: false,
            deletedAt: new Date()
          } 
        },
        { new: true }
      );

      if (!customer) {
        throw new Error('Customer not found');
      }

      logger.info(`Customer account deactivated: ${customer.email}`);

      return {
        message: 'Account deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting customer account:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {String} refreshToken - Refresh token
   * @returns {Object} New access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      
      // Find customer with this refresh token
      const customer = await Customer.findOne({ 
        _id: decoded.id,
        refreshToken: refreshToken 
      });

      if (!customer) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const newToken = this.generateToken(customer);

      return {
        token: newToken
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   * @param {Object} customer - Customer object
   * @returns {String} JWT token
   */
  generateToken(customer) {
    return jwt.sign(
      {
        id: customer._id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Generate refresh token
   * @param {Object} customer - Customer object
   * @returns {String} Refresh token
   */
  generateRefreshToken(customer) {
    return jwt.sign(
      {
        id: customer._id,
        type: 'refresh'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * Get all customers (admin only)
   * @param {Object} query - Query parameters
   * @returns {Object} List of customers
   */
  async getAllCustomers(query = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt', ...filters } = query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort
      };

      const customers = await Customer.find(filters)
        .sort(options.sort)
        .limit(options.limit)
        .skip((options.page - 1) * options.limit);

      const total = await Customer.countDocuments(filters);

      return {
        customers,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching customers:', error);
      throw error;
    }
  }
}

module.exports = new CustomerService();