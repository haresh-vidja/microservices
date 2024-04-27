/**
 * Seller Service Layer
 * Contains business logic for seller operations
 */

const Seller = require('../models/Seller');
const Role = require('../models/Role');
const Business = require('../models/Business');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

// Utility function to mark media as used
const markMediaAsUsed = async (mediaId) => {
  if (!mediaId) return;
  
  const axios = require('axios');
  const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || 'http://localhost:3003';
  
  try {
    await axios.post(`${MEDIA_SERVICE_URL}/api/v1/media/mark-used/${mediaId}`, {}, {
      headers: {
        'X-Service-Key': process.env.MEDIA_SERVICE_KEY || 'seller-secret-key-2024'
      },
      timeout: 5000
    });
    logger.info(`Media ${mediaId} marked as used`);
  } catch (error) {
    logger.error(`Failed to mark media ${mediaId} as used:`, error.message);
    // Don't throw error - seller operation should still succeed
  }
};

class SellerService {
  /**
   * Initialize default roles on startup
   */
  async initializeRoles() {
    try {
      await Role.createDefaultRoles();
      logger.info('Default roles initialized');
    } catch (error) {
      logger.error('Error initializing roles:', error);
    }
  }

  /**
   * Register a new seller
   * @param {Object} userData - Seller registration data
   * @returns {Object} Created seller and token
   */
  async signUp(userData) {
    try {
      // Check if seller already exists
      const existingSeller = await Seller.findOne({ 
        email: userData.email 
      });
      
      if (existingSeller) {
        throw new Error('Seller with this email already exists');
      }

      // Get default seller role
      const defaultRole = await Role.findOne({ name: 'seller', isDefault: true });
      if (!defaultRole) {
        throw new Error('Default seller role not found');
      }

      // Create new seller
      const sellerData = {
        ...userData,
        role: defaultRole._id
      };
      
      const seller = new Seller(sellerData);
      await seller.save();

      // Create business profile
      const businessData = {
        sellerId: seller._id,
        businessName: userData.businessName,
        businessType: userData.businessType || 'individual',
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        description: userData.businessDescription
      };
      
      const business = new Business(businessData);
      await business.save();

      // Generate JWT token
      const token = this.generateToken(seller);
      
      // Generate refresh token
      const refreshToken = this.generateRefreshToken(seller);
      
      // Save refresh token to database
      seller.refreshToken = refreshToken;
      await seller.save();

      logger.info(`New seller registered: ${seller.email}`);

      return {
        seller: seller.toJSON(),
        business: business.toJSON(),
        token,
        refreshToken
      };
    } catch (error) {
      logger.error('Error in seller signup:', error);
      throw error;
    }
  }

  /**
   * Authenticate seller
   * @param {Object} credentials - Email and password
   * @returns {Object} Seller data and token
   */
  async signIn(credentials) {
    try {
      const { email, password } = credentials;

      // Find seller with password field (handle missing role gracefully)
      const seller = await Seller.findOne({ email })
        .select('+password +loginAttempts +lockUntil');
      
      if (!seller) {
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (seller.isLocked()) {
        throw new Error('Account is locked due to too many failed login attempts');
      }

      // Check if account is active
      if (!seller.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await seller.comparePassword(password);
      
      if (!isPasswordValid) {
        await seller.incLoginAttempts();
        throw new Error('Invalid email or password');
      }

      // Reset login attempts
      await seller.resetLoginAttempts();

      // Generate tokens
      const token = this.generateToken(seller);
      const refreshToken = this.generateRefreshToken(seller);
      
      // Update refresh token
      seller.refreshToken = refreshToken;
      await seller.save();

      logger.info(`Seller logged in: ${seller.email}`);

      return {
        seller: seller.toJSON(),
        role: seller.role || null,
        accessToken: token,
        refreshToken
      };
    } catch (error) {
      logger.error('Error in seller signin:', error);
      throw error;
    }
  }

  /**
   * Create a new seller (admin only)
   * @param {Object} userData - Seller data
   * @param {Object} currentSeller - Current authenticated seller
   * @returns {Object} Created seller
   */
  async create(userData, currentSeller) {
    try {
      // Check if seller already exists
      const existingSeller = await Seller.findOne({ 
        email: userData.email 
      });
      
      if (existingSeller) {
        throw new Error('Seller with this email already exists');
      }

      // Get role or use default
      let role;
      if (userData.roleId) {
        role = await Role.findById(userData.roleId);
        if (!role) {
          throw new Error('Role not found');
        }
      } else {
        role = await Role.findOne({ name: 'seller', isDefault: true });
        if (!role) {
          throw new Error('Default seller role not found');
        }
      }

      // Create new seller
      const sellerData = {
        ...userData,
        role: role._id
      };
      
      const seller = new Seller(sellerData);
      await seller.save();

      // Create business profile if business data provided
      if (userData.businessName) {
        const businessData = {
          sellerId: seller._id,
          businessName: userData.businessName,
          businessType: userData.businessType || 'individual',
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          description: userData.businessDescription
        };
        
        const business = new Business(businessData);
        await business.save();
      }

      logger.info(`Seller created by ${currentSeller.email}: ${seller.email}`);

      return seller.toJSON();
    } catch (error) {
      logger.error('Error creating seller:', error);
      throw error;
    }
  }

  /**
   * Get seller list with filters
   * @param {Object} query - Query parameters
   * @param {Object} currentSeller - Current authenticated seller
   * @returns {Object} List of sellers
   */
  async getSellerList(query = {}, currentSeller) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt', ...filters } = query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort
      };

      const sellers = await Seller.find(filters)
        .populate('role', 'name level')
        .sort(options.sort)
        .limit(options.limit)
        .skip((options.page - 1) * options.limit);

      const total = await Seller.countDocuments(filters);

      return {
        sellers,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching sellers:', error);
      throw error;
    }
  }

  /**
   * Get seller profile
   * @param {String} sellerId - Seller ID
   * @returns {Object} Seller profile with business
   */
  async getProfile(sellerId) {
    try {
      const seller = await Seller.findById(sellerId)
        .populate('role', 'name permissions level');
      
      if (!seller) {
        throw new Error('Seller not found');
      }

      const business = await Business.findOne({ sellerId });

      return {
        seller: seller.toJSON(),
        business: business ? business.toJSON() : null
      };
    } catch (error) {
      logger.error('Error fetching seller profile:', error);
      throw error;
    }
  }

  /**
   * Update seller profile
   * @param {String} sellerId - Seller ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated seller profile with business
   */
  async updateProfile(sellerId, updateData) {
    try {
      // Separate seller and business data
      const { 
        businessName, 
        businessType, 
        description,
        logoMediaId, 
        website,
        industry,
        categories,
        establishedDate,
        employeeCount,
        address: businessAddress,
        phone: businessPhone,
        ...sellerData 
      } = updateData;

      // Prevent updating sensitive seller fields
      delete sellerData.password;
      delete sellerData.email;
      delete sellerData.refreshToken;
      delete sellerData.role;
      delete sellerData.isVerified;
      delete sellerData.businessDocuments;

      // Update seller data
      const seller = await Seller.findByIdAndUpdate(
        sellerId,
        { $set: sellerData },
        { new: true, runValidators: true }
      ).populate('role', 'name level');

      if (!seller) {
        throw new Error('Seller not found');
      }

      // Prepare business update data
      const businessUpdateData = {};
      
      if (businessName !== undefined) businessUpdateData.businessName = businessName;
      if (businessType !== undefined) businessUpdateData.businessType = businessType;
      if (description !== undefined) businessUpdateData.description = description;
      if (logoMediaId !== undefined) businessUpdateData.logoMediaId = logoMediaId;
      if (website !== undefined) businessUpdateData.website = website;
      if (industry !== undefined) businessUpdateData.industry = industry;
      if (categories !== undefined) businessUpdateData.categories = categories;
      if (establishedDate !== undefined) businessUpdateData.establishedDate = establishedDate;
      if (employeeCount !== undefined) businessUpdateData.employeeCount = employeeCount;
      if (businessPhone !== undefined) businessUpdateData.phone = businessPhone;
      if (businessAddress !== undefined) businessUpdateData.address = businessAddress;

      // Update business profile if business data provided
      let business = null;
      if (Object.keys(businessUpdateData).length > 0) {
        business = await Business.findOneAndUpdate(
          { sellerId },
          { $set: businessUpdateData },
          { new: true, runValidators: true, upsert: false }
        );
        
        if (!business) {
          // Create business profile if it doesn't exist
          business = new Business({
            sellerId,
            email: seller.email,
            ...businessUpdateData
          });
          await business.save();
        }
      } else {
        // Get existing business profile
        business = await Business.findOne({ sellerId });
      }

      // Mark media files as used after successful profile update
      if (updateData.profileImage) {
        markMediaAsUsed(updateData.profileImage); // Don't await - run async
      }

      // Mark business document media as used
      if (updateData.businessDocuments && Array.isArray(updateData.businessDocuments)) {
        updateData.businessDocuments.forEach(doc => {
          if (doc.media_id) {
            markMediaAsUsed(doc.media_id); // Don't await - run async
          }
        });
      }

      logger.info(`Seller profile updated: ${seller.email}`);

      return {
        seller: seller.toJSON(),
        business: business ? business.toJSON() : null
      };
    } catch (error) {
      logger.error('Error updating seller profile:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   * @param {Object} seller - Seller object
   * @returns {String} JWT token
   */
  generateToken(seller) {
    return jwt.sign(
      {
        id: seller._id,
        email: seller.email,
        firstName: seller.firstName,
        lastName: seller.lastName,
        role: seller.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Generate refresh token
   * @param {Object} seller - Seller object
   * @returns {String} Refresh token
   */
  generateRefreshToken(seller) {
    return jwt.sign(
      {
        id: seller._id,
        type: 'refresh'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * Get multiple sellers by IDs (for inter-service communication)
   * @param {Array<string>} sellerIds - Array of seller IDs
   * @returns {Promise<Array>} Seller data
   */
  async getSellersByIds(sellerIds) {
    try {
      const sellers = await Seller.find({
        _id: { $in: sellerIds },
        isActive: true
      })
      .select('_id firstName lastName email phone businessName logo createdAt')
      .populate('business', 'businessName businessType address');

      return sellers.map(seller => ({
        id: seller._id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        fullName: `${seller.firstName} ${seller.lastName}`,
        email: seller.email,
        phone: seller.phone,
        businessName: seller.businessName,
        logo: seller.logo,
        business: seller.business,
        createdAt: seller.createdAt
      }));
    } catch (error) {
      logger.error('Error fetching sellers by IDs:', error);
      throw error;
    }
  }

  /**
   * Verify if seller exists and is active
   * @param {string} sellerId - Seller ID
   * @returns {Promise<boolean>} Verification result
   */
  async verifySeller(sellerId) {
    try {
      const seller = await Seller.findById(sellerId).select('isActive');
      return !!(seller && seller.isActive);
    } catch (error) {
      logger.error('Error verifying seller:', error);
      return false;
    }
  }
}

module.exports = new SellerService();