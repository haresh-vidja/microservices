import React, { useState, useRef } from 'react';
import { Button, Alert, Progress } from 'reactstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const ImageUploader = ({ 
  onUpload, 
  onRemove, 
  currentImage = null, 
  accept = "image/*", 
  maxSize = 5 * 1024 * 1024, // 5MB
  uploadType = 'product',
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(currentImage);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Upload file
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      const response = await axios.post('http://localhost:3003/api/v1/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      if (response.data.success) {
        const uploadedFile = response.data.data;
        
        // Call parent callback with uploaded file info
        if (onUpload) {
          onUpload({
            id: uploadedFile.id,
            url: uploadedFile.access_url,
            thumbnailUrl: uploadedFile.thumbnail_url,
            originalFilename: uploadedFile.original_filename,
            fileSize: uploadedFile.file_size,
            contentType: uploadedFile.content_type
          });
        }

        toast.success('Image uploaded successfully!');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload image. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Remove preview if upload failed
      setPreview(currentImage);
      
      // Revoke the preview URL to prevent memory leaks
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    // Revoke preview URL if it's a blob
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    
    setPreview(null);
    setError('');
    
    if (onRemove) {
      onRemove();
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`image-uploader ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        style={{ display: 'none' }}
      />

      {error && (
        <Alert color="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {uploading && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="text-muted">Uploading...</small>
            <small className="text-muted">{uploadProgress}%</small>
          </div>
          <Progress value={uploadProgress} color="primary" />
        </div>
      )}

      <div className="upload-area">
        {preview ? (
          <div className="image-preview position-relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="img-fluid rounded shadow-sm"
              style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }}
            />
            <div className="image-overlay">
              <Button 
                color="danger" 
                size="sm" 
                onClick={handleRemove}
                disabled={uploading}
                className="me-2"
              >
                <i className="fas fa-trash"></i> Remove
              </Button>
              <Button 
                color="secondary" 
                size="sm" 
                onClick={triggerFileInput}
                disabled={uploading}
              >
                <i className="fas fa-edit"></i> Change
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="upload-placeholder d-flex flex-column align-items-center justify-content-center p-4 border border-dashed rounded"
            style={{ 
              minHeight: '200px', 
              cursor: 'pointer', 
              backgroundColor: '#f8f9fa',
              borderColor: '#dee2e6'
            }}
            onClick={triggerFileInput}
          >
            <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
            <p className="text-muted text-center mb-2">
              <strong>Click to upload image</strong>
            </p>
            <p className="text-muted small text-center mb-0">
              Supports: JPG, PNG, GIF (Max: {Math.round(maxSize / 1024 / 1024)}MB)
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .image-uploader .upload-area {
          position: relative;
        }
        
        .image-uploader .image-preview:hover .image-overlay {
          opacity: 1;
        }
        
        .image-uploader .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 0.375rem;
        }
        
        .image-uploader .upload-placeholder:hover {
          background-color: #e9ecef !important;
          border-color: #adb5bd !important;
        }
      `}</style>
    </div>
  );
};

export default ImageUploader;