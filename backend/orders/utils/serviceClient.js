/**
 * Service Client Utility
 * Handles REST API communication between services with shared secret authentication
 */

const axios = require('axios');
const config = require('../config');
const logger = require('./logger');

class ServiceClient {
  constructor() {
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Create authenticated axios instance for service communication
   */
  createClient(serviceConfig) {
    return axios.create({
      baseURL: serviceConfig.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': serviceConfig.secretKey,
        'User-Agent': 'Orders-Service/1.0'
      }
    });
  }

  /**
   * Get customer information
   */
  async getCustomer(customerId) {
    try {
      const client = this.createClient(config.services.customer);
      const response = await client.get(`/api/v1/customers/profile/${customerId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch customer');
      }
    } catch (error) {
      logger.error('Error fetching customer:', error);
      if (error.response) {
        throw new Error(`Customer service error: ${error.response.data.message || error.message}`);
      }
      throw new Error('Customer service unavailable');
    }
  }

  /**
   * Get customer addresses
   */
  async getCustomerAddresses(customerId) {
    try {
      const client = this.createClient(config.services.customer);
      const response = await client.get(`/api/v1/addresses?customerId=${customerId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch addresses');
      }
    } catch (error) {
      logger.error('Error fetching customer addresses:', error);
      if (error.response) {
        throw new Error(`Customer service error: ${error.response.data.message || error.message}`);
      }
      throw new Error('Customer service unavailable');
    }
  }

  /**
   * Get seller information
   */
  async getSeller(sellerId) {
    try {
      const client = this.createClient(config.services.sellers);
      const response = await client.get(`/api/v1/sellers/profile/${sellerId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch seller');
      }
    } catch (error) {
      logger.error('Error fetching seller:', error);
      if (error.response) {
        throw new Error(`Sellers service error: ${error.response.data.message || error.message}`);
      }
      throw new Error('Sellers service unavailable');
    }
  }

  /**
   * Get product information
   */
  async getProduct(productId) {
    try {
      const client = this.createClient(config.services.products);
      const response = await client.get(`/api/v1/products/${productId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch product');
      }
    } catch (error) {
      logger.error('Error fetching product:', error);
      if (error.response) {
        throw new Error(`Products service error: ${error.response.data.message || error.message}`);
      }
      throw new Error('Products service unavailable');
    }
  }

  /**
   * Get multiple products
   */
  async getProducts(productIds) {
    try {
      const client = this.createClient(config.services.products);
      const response = await client.post('/api/v1/products/batch', {
        productIds
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch products');
      }
    } catch (error) {
      logger.error('Error fetching products:', error);
      if (error.response) {
        throw new Error(`Products service error: ${error.response.data.message || error.message}`);
      }
      throw new Error('Products service unavailable');
    }
  }

  /**
   * Update product stock
   */
  async updateProductStock(productId, newStock) {
    try {
      const client = this.createClient(config.services.products);
      const response = await client.put(`/api/v1/products/${productId}/stock`, {
        stock: newStock
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update stock');
      }
    } catch (error) {
      logger.error('Error updating product stock:', error);
      if (error.response) {
        throw new Error(`Products service error: ${error.response.data.message || error.message}`);
      }
      throw new Error('Products service unavailable');
    }
  }

  /**
   * Get media file information
   */
  async getMediaFile(fileId) {
    try {
      const client = this.createClient(config.services.media);
      const response = await client.get(`/api/v1/media/${fileId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch media file');
      }
    } catch (error) {
      logger.error('Error fetching media file:', error);
      if (error.response) {
        throw new Error(`Media service error: ${error.response.data.message || error.message}`);
      }
      throw new Error('Media service unavailable');
    }
  }

  /**
   * Mark media files as used
   */
  async markMediaAsUsed(fileIds) {
    try {
      const client = this.createClient(config.services.media);
      const response = await client.post('/api/v1/media/mark-used', {
        ids: fileIds
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to mark media as used');
      }
    } catch (error) {
      logger.error('Error marking media as used:', error);
      if (error.response) {
        throw new Error(`Media service error: ${error.response.data.message || error.message}`);
      }
      throw new Error('Media service unavailable');
    }
  }

  /**
   * Validate service connectivity
   */
  async healthCheck() {
    const services = ['customer', 'sellers', 'products', 'media'];
    const results = {};
    
    for (const service of services) {
      try {
        const client = this.createClient(config.services[service]);
        const response = await client.get('/health');
        results[service] = {
          status: 'healthy',
          response: response.data
        };
      } catch (error) {
        results[service] = {
          status: 'unhealthy',
          error: error.message
        };
        logger.error(`${service} service health check failed:`, error.message);
      }
    }
    
    return results;
  }

  /**
   * Batch operation with error handling
   */
  async batchOperation(operations) {
    const results = [];
    const errors = [];
    
    for (const operation of operations) {
      try {
        const result = await operation();
        results.push({
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message
        });
        errors.push(error);
      }
    }
    
    return {
      results,
      errors,
      hasErrors: errors.length > 0
    };
  }
}

module.exports = new ServiceClient();