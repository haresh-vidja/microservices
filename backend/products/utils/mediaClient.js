/**
 * Media Service Client
 * Handles communication with the Media service
 */

const axios = require('axios');
const config = require('../config');

class MediaClient {
  constructor() {
    this.timeout = 5000;
  }

  /**
   * Create authenticated axios instance for media service
   */
  createClient() {
    return axios.create({
      baseURL: config.services.media.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': config.services.media.secretKey,
        'User-Agent': 'Products-Service/1.0'
      }
    });
  }

  /**
   * Mark a single media file as used
   */
  async markAsUsed(mediaId) {
    try {
      const client = this.createClient();
      await client.post(`/api/v1/media/mark-used/${mediaId}`);
      console.log(`✅ Marked media ${mediaId} as used`);
    } catch (error) {
      console.error(`❌ Failed to mark media ${mediaId} as used:`, error.message);
      // Don't throw error - product creation should still succeed
    }
  }

  /**
   * Mark multiple media files as used (batch operation)
   */
  async markMultipleAsUsed(mediaIds) {
    if (!mediaIds || mediaIds.length === 0) return;
    
    try {
      const client = this.createClient();
      await client.post('/api/v1/media/bulk-mark-used', {
        fileIds: mediaIds
      });
      console.log(`✅ Marked ${mediaIds.length} media files as used`);
    } catch (error) {
      console.error(`❌ Failed to mark multiple media files as used:`, error.message);
      // Fallback to individual marking
      for (const mediaId of mediaIds) {
        await this.markAsUsed(mediaId);
      }
    }
  }

  /**
   * Validate media files exist and are accessible
   */
  async validateMediaFiles(mediaIds) {
    if (!mediaIds || mediaIds.length === 0) return { valid: [], invalid: [] };
    
    try {
      const client = this.createClient();
      const response = await client.post('/api/v1/media/validate', {
        fileIds: mediaIds
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to validate media files');
      }
    } catch (error) {
      console.error('❌ Failed to validate media files:', error.message);
      // Return all as invalid on error
      return {
        valid: [],
        invalid: mediaIds.map(id => ({ id, reason: error.message }))
      };
    }
  }

  /**
   * Get media file information
   */
  async getMediaInfo(mediaId) {
    try {
      const client = this.createClient();
      const response = await client.get(`/api/v1/media/${mediaId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch media info');
      }
    } catch (error) {
      console.error(`❌ Failed to get media info for ${mediaId}:`, error.message);
      throw error;
    }
  }
}

module.exports = new MediaClient();