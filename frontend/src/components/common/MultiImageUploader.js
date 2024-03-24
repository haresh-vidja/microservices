import React, { useState } from 'react';
import { Row, Col, Button, Alert } from 'reactstrap';
import ImageUploader from './ImageUploader';

const MultiImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 5,
  mainImageIndex = 0,
  onMainImageChange,
  className = ''
}) => {
  const [error, setError] = useState('');

  const handleImageUpload = (index, imageData) => {
    const newImages = [...images];
    newImages[index] = imageData;
    onImagesChange(newImages);
    setError('');
  };

  const handleImageRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // Adjust main image index if needed
    if (mainImageIndex >= newImages.length && newImages.length > 0) {
      onMainImageChange(0);
    } else if (mainImageIndex === index && newImages.length > 0) {
      onMainImageChange(0);
    }
    setError('');
  };

  const addNewImageSlot = () => {
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }
    
    const newImages = [...images, null];
    onImagesChange(newImages);
    setError('');
  };

  const setAsMainImage = (index) => {
    onMainImageChange(index);
  };

  return (
    <div className={`multi-image-uploader ${className}`}>
      {error && (
        <Alert color="danger" className="mb-3">
          {error}
        </Alert>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Product Images</h6>
        <small className="text-muted">{images.length}/{maxImages} images</small>
      </div>

      <Row>
        {images.map((image, index) => (
          <Col md="6" lg="4" key={index} className="mb-3">
            <div className="position-relative">
              <ImageUploader
                currentImage={image?.url}
                onUpload={(imageData) => handleImageUpload(index, imageData)}
                onRemove={() => handleImageRemove(index)}
                uploadType="product"
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
              />
              
              {image && (
                <div className="image-controls mt-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {index === mainImageIndex ? (
                        <span className="badge badge-primary">Main Image</span>
                      ) : (
                        <Button
                          color="link"
                          size="sm"
                          className="p-0 text-decoration-none"
                          onClick={() => setAsMainImage(index)}
                        >
                          Set as main
                        </Button>
                      )}
                    </small>
                    <small className="text-muted">
                      {image.originalFilename}
                    </small>
                  </div>
                </div>
              )}
            </div>
          </Col>
        ))}
      </Row>

      {images.length < maxImages && (
        <div className="text-center mt-3">
          <Button 
            color="outline-primary" 
            onClick={addNewImageSlot}
            disabled={images.length >= maxImages}
          >
            <i className="fas fa-plus me-2"></i>
            Add Image ({images.length}/{maxImages})
          </Button>
        </div>
      )}

      <div className="mt-3">
        <small className="text-muted">
          <i className="fas fa-info-circle me-1"></i>
          Upload up to {maxImages} images. The first image will be used as the main product image.
          Supported formats: JPG, PNG, GIF (Max: 5MB each)
        </small>
      </div>

      <style jsx>{`
        .multi-image-uploader .image-controls {
          font-size: 0.875rem;
        }
        
        .multi-image-uploader .badge {
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default MultiImageUploader;