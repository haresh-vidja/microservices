import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardImg, CardBody, Button, Badge, Input, FormGroup, Label } from 'reactstrap';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${id}`);
      
      if (response.data.success) {
        setProduct(response.data.data);
      } else {
        toast.error('Product not found');
        history.push('/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product details');
      history.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;
    
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existingItem = cartItems.find(item => item._id === product._id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cartItems.push({ ...product, quantity });
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    toast.success(`${quantity} item(s) added to cart!`);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h3>Product not found</h3>
          <Button color="primary" onClick={() => history.push('/products')}>
            Back to Products
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col md="6">
          <Card>
            <CardBody>
              {product.images && product.images.length > 0 ? (
                <>
                  <CardImg 
                    top 
                    src={product.images[selectedImage]} 
                    alt={product.name}
                    style={{ height: '400px', objectFit: 'cover', marginBottom: '15px' }}
                  />
                  {product.images.length > 1 && (
                    <Row>
                      {product.images.map((image, index) => (
                        <Col xs="3" key={index}>
                          <img
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: '60px', 
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: selectedImage === index ? '2px solid #007bff' : '1px solid #ddd'
                            }}
                            onClick={() => setSelectedImage(index)}
                          />
                        </Col>
                      ))}
                    </Row>
                  )}
                </>
              ) : (
                <div 
                  className="d-flex align-items-center justify-content-center bg-light"
                  style={{ height: '400px' }}
                >
                  <span className="text-muted">No image available</span>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col md="6">
          <div>
            <h2>{product.name}</h2>
            
            <div className="mb-3">
              <Badge color="secondary" className="mr-2">
                {product.category}
              </Badge>
              {product.stock > 0 ? (
                <Badge color="success">In Stock ({product.stock})</Badge>
              ) : (
                <Badge color="danger">Out of Stock</Badge>
              )}
            </div>

            <h3 className="text-primary mb-3">${product.price}</h3>

            <p className="mb-4">{product.description}</p>

            {product.specifications && (
              <div className="mb-4">
                <h5>Specifications</h5>
                <ul>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.stock > 0 && (
              <div className="mb-4">
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="quantity">Quantity</Label>
                      <Input
                        type="number"
                        id="quantity"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={handleQuantityChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                
                <Button 
                  color="success" 
                  size="lg" 
                  block
                  onClick={addToCart}
                >
                  Add to Cart
                </Button>
              </div>
            )}

            <div className="mt-4">
              <Button 
                color="secondary" 
                outline
                onClick={() => history.push('/products')}
              >
                Back to Products
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;