import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import { useHistory, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ImageUploader from '../../components/common/ImageUploader';
import MultiImageUploader from '../../components/common/MultiImageUploader';

const EditProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'electronics',
    stock: '',
    specifications: ''
  });
  const [specifications, setSpecifications] = useState([
    { title: '', detail: '' }
  ]);
  const [mainImage, setMainImage] = useState(null);
  const [otherImages, setOtherImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
  const [error, setError] = useState('');
  const [originalMainImageId, setOriginalMainImageId] = useState(null);
  const [originalOtherImageIds, setOriginalOtherImageIds] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const history = useHistory();
  const { id: productId } = useParams();

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) {
        history.push('/seller/login');
        return;
      }

      const response = await axios.get(`/api/products/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const product = response.data.data;
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          category: product.category || 'electronics',
          stock: product.stock || '',
          specifications: product.specifications ? JSON.stringify(product.specifications, null, 2) : ''
        });

        // Convert specifications object to array format
        if (product.specifications && typeof product.specifications === 'object') {
          const specsArray = Object.entries(product.specifications).map(([title, detail]) => ({
            title,
            detail
          }));
          setSpecifications(specsArray.length > 0 ? specsArray : [{ title: '', detail: '' }]);
        } else {
          setSpecifications([{ title: '', detail: '' }]);
        }

        // Set images
        if (product.images && product.images.length > 0) {
          // Create image objects from backend image format
          const imageObjects = product.images.map((image, index) => {
            // Handle both old format (string URL) and new format (object with media_id)
            if (typeof image === 'string') {
              return {
                id: `existing-${index}`,
                url: image,
                originalFilename: `image-${index + 1}.jpg`
              };
            } else if (image.media_id) {
              return {
                id: `existing-${index}`,
                media_id: image.media_id,
                url: `http://localhost:8000/media/${image.media_id}`,
                originalFilename: `image-${index + 1}.jpg`,
                isPrimary: image.isPrimary
              };
            } else if (image.url) {
              return {
                id: `existing-${index}`,
                url: image.url,
                originalFilename: `image-${index + 1}.jpg`,
                isPrimary: image.isPrimary
              };
            }
            return null;
          }).filter(Boolean);
          
          setMainImage(imageObjects[0]);
          setOriginalMainImageId(imageObjects[0].id);
          
          if (imageObjects.length > 1) {
            setOtherImages(imageObjects.slice(1));
            setOriginalOtherImageIds(imageObjects.slice(1).map(img => img.id));
          } else {
            setOriginalOtherImageIds([]);
          }
        } else {
          setOriginalMainImageId(null);
          setOriginalOtherImageIds([]);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product details');
      if (error.response?.status === 401) {
        history.push('/seller/login');
      }
    } finally {
      setFetchingProduct(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSpecificationChange = (index, field, value) => {
    const updatedSpecs = [...specifications];
    updatedSpecs[index] = {
      ...updatedSpecs[index],
      [field]: value
    };
    setSpecifications(updatedSpecs);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { title: '', detail: '' }]);
  };

  const removeSpecification = (index) => {
    if (specifications.length > 1) {
      const updatedSpecs = specifications.filter((_, i) => i !== index);
      setSpecifications(updatedSpecs);
    }
  };

  // Track when existing images are deleted
  const handleMainImageRemove = () => {
    if (mainImage && mainImage.id && mainImage.id.startsWith('existing-')) {
      setDeletedImageIds(prev => [...prev, mainImage.id]);
    }
    setMainImage(null);
  };

  const handleOtherImagesChange = (newImages) => {
    // Find deleted images by comparing with current otherImages
    const currentIds = otherImages.map(img => img?.id).filter(Boolean);
    const newIds = newImages.map(img => img?.id).filter(Boolean);
    
    const deletedIds = currentIds.filter(id => 
      id.startsWith('existing-') && !newIds.includes(id)
    );
    
    if (deletedIds.length > 0) {
      setDeletedImageIds(prev => [...prev, ...deletedIds]);
    }
    
    setOtherImages(newImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!mainImage) {
      setError('Please upload a main product image');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) {
        history.push('/seller/login');
        return;
      }

      // Prepare images array for the API (media_id-based for secure architecture)
      const images = [];
      const allImageIds = [];
      
      if (mainImage) {
        // Check if it's a new upload (has media_id) or existing image (has url)
        if (mainImage.media_id) {
          images.push({
            media_id: mainImage.media_id,
            isPrimary: true
          });
          allImageIds.push(mainImage.media_id);
        } else if (mainImage.url) {
          images.push({
            url: mainImage.url,
            isPrimary: true
          });
          if (mainImage.id) {
            allImageIds.push(mainImage.id);
          }
        }
      }
      
      otherImages.forEach(image => {
        if (image) {
          // Check if it's a new upload (has media_id) or existing image (has url)
          if (image.media_id) {
            images.push({
              media_id: image.media_id,
              isPrimary: false
            });
            allImageIds.push(image.media_id);
          } else if (image.url) {
            images.push({
              url: image.url,
              isPrimary: false
            });
            if (image.id) {
              allImageIds.push(image.id);
            }
          }
        }
      });

      // Prepare specifications object
      const specsObject = {};
      specifications.forEach(spec => {
        if (spec.title.trim() && spec.detail.trim()) {
          specsObject[spec.title.trim()] = spec.detail.trim();
        }
      });

      // Prepare product data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        images: images,
        specifications: specsObject
      };

      const response = await axios.put(`/api/products/products/${productId}`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Mark new images as used in media service (only newly uploaded images with media_id)
        const newMediaIds = allImageIds.filter(id => 
          id && !id.startsWith('existing-') && id.match(/^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i)
        );
        if (newMediaIds.length > 0) {
          try {
            await axios.post('http://localhost:8000/api/media/media/bulk-mark-used', {
              ids: newMediaIds
            });
          } catch (mediaError) {
            console.warn('Failed to mark images as used:', mediaError);
            // Don't fail the product update if marking images fails
          }
        }

        // Mark deleted images as not used so they can be cleaned up
        if (deletedImageIds.length > 0) {
          // Convert existing-X IDs back to actual media IDs
          // Since we're using mock IDs for existing images, we need to handle this differently
          // For now, we'll log this - in a real implementation, you'd need the actual media IDs
          console.log('Images marked for deletion:', deletedImageIds);
          
          try {
            // Note: This would need actual media IDs, not existing-X mock IDs
            // You might need to store the actual media IDs when fetching the product
            // For now, we'll skip this call since existing-X are not real UUIDs
            // await axios.post('http://localhost:3003/api/v1/media/mark-not-used', {
            //   ids: deletedImageIds
            // });
          } catch (mediaError) {
            console.warn('Failed to mark deleted images as not used:', mediaError);
          }
        }

        toast.success('Product updated successfully!');
        history.push('/seller/products');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update product. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <Row className="justify-content-center">
      <Col lg="10" xl="8">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Edit Product</h2>
                <Button color="secondary" outline tag={Link} to="/seller/dashboard">
                  Back to Dashboard
                </Button>
              </div>
              
              {error && <Alert color="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md="8">
                    <FormGroup>
                      <Label for="name">Product Name *</Label>
                      <Input
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Enter product name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label for="category">Category *</Label>
                      <Input
                        type="select"
                        name="category"
                        id="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="books">Books</option>
                        <option value="home">Home & Garden</option>
                        <option value="sports">Sports</option>
                        <option value="beauty">Beauty</option>
                        <option value="toys">Toys</option>
                        <option value="automotive">Automotive</option>
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>

                <FormGroup>
                  <Label for="description">Description</Label>
                  <Input
                    type="textarea"
                    name="description"
                    id="description"
                    rows="4"
                    placeholder="Enter product description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </FormGroup>

                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="price">Price * ($)</Label>
                      <Input
                        type="number"
                        name="price"
                        id="price"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="stock">Stock Quantity *</Label>
                      <Input
                        type="number"
                        name="stock"
                        id="stock"
                        placeholder="0"
                        min="0"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <FormGroup>
                  <Label>Main Product Image *</Label>
                  <ImageUploader
                    currentImage={mainImage?.url}
                    currentMediaId={mainImage?.media_id}
                    onUpload={setMainImage}
                    onRemove={handleMainImageRemove}
                    uploadType="product"
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                    className="mb-3"
                  />
                  <small className="text-muted">Upload the main product image (Required)</small>
                </FormGroup>

                <FormGroup>
                  <Label>Additional Product Images</Label>
                  <MultiImageUploader
                    images={otherImages}
                    onImagesChange={handleOtherImagesChange}
                    maxImages={4}
                    mainImageIndex={mainImageIndex}
                    onMainImageChange={setMainImageIndex}
                    className="mb-3"
                  />
                  <small className="text-muted">Upload up to 4 additional images (Optional)</small>
                </FormGroup>

                <FormGroup>
                  <Label>Product Specifications</Label>
                  <div className="specifications-table">
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead className="bg-light">
                          <tr>
                            <th>Title</th>
                            <th>Detail</th>
                            <th width="100">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {specifications.map((spec, index) => (
                            <tr key={index}>
                              <td>
                                <Input
                                  type="text"
                                  placeholder="e.g., Brand, Color, Size"
                                  value={spec.title}
                                  onChange={(e) => handleSpecificationChange(index, 'title', e.target.value)}
                                />
                              </td>
                              <td>
                                <Input
                                  type="text"
                                  placeholder="e.g., Apple, Red, Large"
                                  value={spec.detail}
                                  onChange={(e) => handleSpecificationChange(index, 'detail', e.target.value)}
                                />
                              </td>
                              <td>
                                <div className="d-flex">
                                  {index === specifications.length - 1 && (
                                    <Button
                                      color="success"
                                      size="sm"
                                      className="mr-1"
                                      onClick={addSpecification}
                                      type="button"
                                    >
                                      +
                                    </Button>
                                  )}
                                  {specifications.length > 1 && (
                                    <Button
                                      color="danger"
                                      size="sm"
                                      onClick={() => removeSpecification(index)}
                                      type="button"
                                    >
                                      ×
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <small className="text-muted">Add product specifications as key-value pairs (optional)</small>
                </FormGroup>

                <hr />

                <div className="d-flex justify-content-between">
                  <Button 
                    color="secondary" 
                    outline
                    tag={Link}
                    to="/seller/dashboard"
                  >
                    Cancel
                  </Button>
                  <Button 
                    color="success" 
                    type="submit" 
                    disabled={loading}
                    style={{ minWidth: '120px' }}
                  >
                    {loading ? 'Updating...' : 'Update Product'}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
      </Col>
    </Row>
  );
};

export default EditProduct;