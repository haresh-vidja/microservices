import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'electronics',
    stock: '',
    images: '',
    specifications: ''
  });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('sellerData'));
      
      if (!token) {
        history.push('/seller/login');
        return;
      }

      // Prepare product data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sellerId: sellerData.id,
        images: formData.images ? formData.images.split(',').map(url => url.trim()) : [],
        specifications: formData.specifications ? JSON.parse(formData.specifications) : {}
      };

      const response = await axios.post('/api/products', productData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Product added successfully!');
        history.push('/seller/dashboard');
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
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md="8">
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
                  <Label for="images">Product Images (URLs)</Label>
                  <Input
                    type="textarea"
                    name="images"
                    id="images"
                    rows="3"
                    placeholder="Enter image URLs separated by commas&#10;https://example.com/image1.jpg, https://example.com/image2.jpg"
                    value={formData.images}
                    onChange={handleChange}
                  />
                  <small className="text-muted">Separate multiple image URLs with commas</small>
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
                    {loading ? 'Adding...' : 'Add Product'}
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

export default AddProduct;