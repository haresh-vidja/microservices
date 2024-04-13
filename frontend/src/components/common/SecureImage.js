import React from 'react';

/**
 * SecureImage Component
 * Displays images using secure media IDs through API Gateway
 */
const SecureImage = ({ 
  mediaId, 
  isThumb = false, 
  alt = 'Image', 
  className = '', 
  style = {},
  onError = null,
  ...props 
}) => {
  // If no mediaId provided, show placeholder
  if (!mediaId) {
    return (
      <div 
        className={`d-flex align-items-center justify-content-center bg-light text-muted ${className}`}
        style={{
          minHeight: '100px',
          border: '1px solid #dee2e6',
          borderRadius: '0.375rem',
          ...style
        }}
        {...props}
      >
        <i className="fas fa-image fa-2x"></i>
      </div>
    );
  }

  // Determine the URL based on whether it's a thumbnail or full image
  const baseUrl = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:8000';
  const imageUrl = isThumb 
    ? `${baseUrl}/thumb/${mediaId}`
    : `${baseUrl}/media/${mediaId}`;

  const handleImageError = (e) => {
    console.warn(`Failed to load image: ${imageUrl}`);
    
    if (onError) {
      onError(e);
    } else {
      // Show placeholder on error
      e.target.style.display = 'none';
      
      // Create placeholder element
      const placeholder = document.createElement('div');
      placeholder.className = `d-flex align-items-center justify-content-center bg-light text-muted ${className}`;
      placeholder.style.cssText = Object.entries({
        minHeight: '100px',
        border: '1px solid #dee2e6',
        borderRadius: '0.375rem',
        ...style
      }).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`).join('; ');
      placeholder.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
      
      e.target.parentNode?.replaceChild(placeholder, e.target);
    }
  };

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      onError={handleImageError}
      loading="lazy"
      {...props}
    />
  );
};

export default SecureImage;