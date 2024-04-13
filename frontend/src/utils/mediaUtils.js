/**
 * Media Utilities for Secure Media Architecture
 * Provides helper functions for working with media IDs and secure URLs
 */

const API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:8000';

/**
 * Get secure media URL from media ID
 * @param {string} mediaId - The media ID
 * @param {boolean} isThumb - Whether to get thumbnail URL
 * @returns {string} Secure media URL
 */
export const getMediaUrl = (mediaId, isThumb = false) => {
  if (!mediaId) return null;
  
  return isThumb 
    ? `${API_GATEWAY_URL}/thumb/${mediaId}`
    : `${API_GATEWAY_URL}/media/${mediaId}`;
};

/**
 * Get thumbnail URL from media ID
 * @param {string} mediaId - The media ID
 * @returns {string} Secure thumbnail URL
 */
export const getThumbUrl = (mediaId) => {
  return getMediaUrl(mediaId, true);
};

/**
 * Convert legacy image objects to media ID format
 * @param {Object|Array} images - Legacy image object(s) with url property
 * @returns {Object|Array} Image object(s) with media_id property
 */
export const convertLegacyImages = (images) => {
  if (!images) return null;
  
  if (Array.isArray(images)) {
    return images.map(img => {
      if (img && img.url && !img.media_id) {
        // Extract media ID from URL if possible
        const urlMatch = img.url.match(/\/media\/([a-f\d-]+)/i);
        return {
          ...img,
          media_id: urlMatch ? urlMatch[1] : null,
          url: undefined // Remove legacy url property
        };
      }
      return img;
    });
  }
  
  // Single image object
  if (images.url && !images.media_id) {
    const urlMatch = images.url.match(/\/media\/([a-f\d-]+)/i);
    return {
      ...images,
      media_id: urlMatch ? urlMatch[1] : null,
      url: undefined
    };
  }
  
  return images;
};

/**
 * Validate media ID format
 * @param {string} mediaId - The media ID to validate
 * @returns {boolean} Whether the media ID is valid
 */
export const isValidMediaId = (mediaId) => {
  if (!mediaId || typeof mediaId !== 'string') return false;
  return /^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i.test(mediaId);
};

/**
 * Preload media for better user experience
 * @param {string|Array} mediaIds - Media ID(s) to preload
 * @param {boolean} includeThumb - Whether to also preload thumbnails
 */
export const preloadMedia = (mediaIds, includeThumb = true) => {
  const ids = Array.isArray(mediaIds) ? mediaIds : [mediaIds];
  
  ids.forEach(mediaId => {
    if (isValidMediaId(mediaId)) {
      // Preload main image
      const mainImg = new Image();
      mainImg.src = getMediaUrl(mediaId);
      
      // Preload thumbnail if requested
      if (includeThumb) {
        const thumbImg = new Image();
        thumbImg.src = getThumbUrl(mediaId);
      }
    }
  });
};

/**
 * Create media object from upload response
 * @param {Object} uploadResponse - Response from media upload API
 * @returns {Object} Standardized media object
 */
export const createMediaObject = (uploadResponse) => {
  if (!uploadResponse || !uploadResponse.media_id) {
    throw new Error('Invalid upload response');
  }
  
  return {
    media_id: uploadResponse.media_id,
    originalFilename: uploadResponse.originalFilename,
    fileSize: uploadResponse.fileSize,
    contentType: uploadResponse.contentType,
    hasThumb: uploadResponse.hasThumb || false,
    isPrimary: false // Default, can be overridden
  };
};

export default {
  getMediaUrl,
  getThumbUrl,
  convertLegacyImages,
  isValidMediaId,
  preloadMedia,
  createMediaObject
};