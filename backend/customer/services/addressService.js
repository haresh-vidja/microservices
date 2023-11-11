/**
 * Address Service Layer
 * Contains business logic for address operations
 */

const Address = require('../models/Address');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

class AddressService {
  /**
   * Create a new address for customer
   * @param {String} customerId - Customer ID
   * @param {Object} addressData - Address data
   * @returns {Object} Created address
   */
  async createAddress(customerId, addressData) {
    try {
      // Verify customer exists
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // If this is the first address or marked as default, set it as default
      const addressCount = await Address.countDocuments({ customerId });
      if (addressCount === 0 || addressData.isDefault) {
        addressData.isDefault = true;
      }

      // Create address
      const address = new Address({
        ...addressData,
        customerId
      });

      await address.save();

      logger.info(`Address created for customer: ${customerId}`);

      return address.toJSON();
    } catch (error) {
      logger.error('Error creating address:', error);
      throw error;
    }
  }

  /**
   * Get all addresses for a customer
   * @param {String} customerId - Customer ID
   * @returns {Array} List of addresses
   */
  async getAddresses(customerId) {
    try {
      const addresses = await Address.find({ 
        customerId,
        isActive: true 
      }).sort('-isDefault -createdAt');

      return addresses;
    } catch (error) {
      logger.error('Error fetching addresses:', error);
      throw error;
    }
  }

  /**
   * Get a specific address
   * @param {String} addressId - Address ID
   * @param {String} customerId - Customer ID
   * @returns {Object} Address details
   */
  async getAddress(addressId, customerId) {
    try {
      const address = await Address.findOne({
        _id: addressId,
        customerId,
        isActive: true
      });

      if (!address) {
        throw new Error('Address not found');
      }

      return address.toJSON();
    } catch (error) {
      logger.error('Error fetching address:', error);
      throw error;
    }
  }

  /**
   * Update an address
   * @param {String} addressId - Address ID
   * @param {String} customerId - Customer ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated address
   */
  async updateAddress(addressId, customerId, updateData) {
    try {
      // Remove fields that shouldn't be updated
      delete updateData.customerId;
      delete updateData._id;

      // If setting as default, handle it properly
      if (updateData.isDefault) {
        await Address.updateMany(
          { customerId, _id: { $ne: addressId } },
          { $set: { isDefault: false } }
        );
      }

      const address = await Address.findOneAndUpdate(
        {
          _id: addressId,
          customerId
        },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!address) {
        throw new Error('Address not found');
      }

      logger.info(`Address updated: ${addressId}`);

      return address.toJSON();
    } catch (error) {
      logger.error('Error updating address:', error);
      throw error;
    }
  }

  /**
   * Delete an address (soft delete)
   * @param {String} addressId - Address ID
   * @param {String} customerId - Customer ID
   * @returns {Object} Success message
   */
  async deleteAddress(addressId, customerId) {
    try {
      const address = await Address.findOneAndUpdate(
        {
          _id: addressId,
          customerId
        },
        { 
          $set: { 
            isActive: false,
            isDefault: false 
          } 
        },
        { new: true }
      );

      if (!address) {
        throw new Error('Address not found');
      }

      // If this was the default address, set another as default
      if (address.isDefault) {
        const nextDefault = await Address.findOneAndUpdate(
          {
            customerId,
            isActive: true
          },
          { $set: { isDefault: true } }
        );
      }

      logger.info(`Address deleted: ${addressId}`);

      return {
        message: 'Address deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting address:', error);
      throw error;
    }
  }

  /**
   * Set an address as default
   * @param {String} addressId - Address ID
   * @param {String} customerId - Customer ID
   * @returns {Object} Success message
   */
  async setDefaultAddress(addressId, customerId) {
    try {
      // Remove default from all other addresses
      await Address.updateMany(
        { customerId },
        { $set: { isDefault: false } }
      );

      // Set this address as default
      const address = await Address.findOneAndUpdate(
        {
          _id: addressId,
          customerId,
          isActive: true
        },
        { $set: { isDefault: true } },
        { new: true }
      );

      if (!address) {
        throw new Error('Address not found');
      }

      logger.info(`Default address set: ${addressId}`);

      return address.toJSON();
    } catch (error) {
      logger.error('Error setting default address:', error);
      throw error;
    }
  }
}

module.exports = new AddressService();