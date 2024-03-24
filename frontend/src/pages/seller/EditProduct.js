import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
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
  const [mainImage, setMainImage] = useState(null);
  const [otherImages, setOtherImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
  const [error, setError] = useState('');
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

      const response = await axios.get(`/api/products/${productId}`, {
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

        // Set images
        if (product.images && product.images.length > 0) {
          // Create image objects from URLs for existing images
          const imageObjects = product.images.map((url, index) => ({
            id: `existing-${index}`,
            url: url,
            originalFilename: `image-${index + 1}.jpg`
          }));
          
          setMainImage(imageObjects[0]);
          if (imageObjects.length > 1) {
            setOtherImages(imageObjects.slice(1));
          }
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

      // Prepare images array
      const allImages = [];
      if (mainImage) {
        allImages.push(mainImage.url);
      }
      otherImages.forEach(image => {
        if (image && image.url) {
          allImages.push(image.url);
        }
      });

      // Prepare product data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        images: allImages,
        specifications: formData.specifications ? JSON.parse(formData.specifications) : {},
        mainImageId: mainImage?.id || null,
        imageIds: [mainImage?.id, ...otherImages.map(img => img?.id)].filter(Boolean)
      };

      const response = await axios.put(`/api/products/${productId}`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Product updated successfully!');
        history.push('/seller/dashboard');
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
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading product details...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md="8">
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
                  <Label for="specifications">Specifications (JSON format)</Label>
                  <Input
                    type="textarea"
                    name="specifications"
                    id="specifications"
                    rows="4"
                    placeholder='{"Brand": "Example Brand", "Model": "XYZ123", "Color": "Black"}'
                    value={formData.specifications}
                    onChange={handleChange}
                  />
                  <small className="text-muted">Enter product specifications in JSON format (optional)</small>
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
    </Container>
  );
};

export default EditProduct;