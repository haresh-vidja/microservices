import React, { useState } from 'react';
import { Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ImageUploader from '../../components/common/ImageUploader';
import MultiImageUploader from '../../components/common/MultiImageUploader';

const AddProduct = () => {
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
  const [error, setError] = useState('');
  const history = useHistory();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!mainImage || !mainImage.media_id) {
      setError('Please upload a main product image');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('sellerData'));
      
      if (!token) {
        history.push('/seller/login');
        return;
      }

      // Prepare images array for the API (media_id-based)
      const images = [];
      
      if (mainImage && mainImage.media_id) {
        images.push({
          media_id: mainImage.media_id,
          isPrimary: true
        });
      }
      
      otherImages.forEach(image => {
        if (image && image.media_id) {
          images.push({
            media_id: image.media_id,
            isPrimary: false
          });
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
        sellerId: sellerData.id,
        images: images,
        specifications: specsObject
      };

      const response = await axios.post('/api/products/products', productData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Mark images as used in media service
        const allImageIds = images.map(img => img?.media_id).filter(Boolean);
        if (allImageIds.length > 0) {
          try {
            await axios.post('http://localhost:8000/api/media/media/bulk-mark-used', {
              ids: allImageIds
            });
          } catch (mediaError) {
            console.warn('Failed to mark images as used:', mediaError);
            // Don't fail the product creation if marking images fails
          }
        }

        toast.success('Product added successfully!');
        history.push('/seller/products');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add product. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="justify-content-center">
      <Col lg="10" xl="8">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Add New Product</h2>
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
                    onUpload={setMainImage}
                    onRemove={() => setMainImage(null)}
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
                    onImagesChange={setOtherImages}
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
                    {loading ? 'Adding...' : 'Add Product'}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
      </Col>
    </Row>
  );
};

export default AddProduct;