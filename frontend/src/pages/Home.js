import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Jumbotron, Button, Card, CardImg, CardBody, CardTitle, CardText, Form, FormGroup, Input, InputGroup, InputGroupAddon } from 'reactstrap';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import SecureImage from '../components/common/SecureImage';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const history = useHistory();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get('/api/products/products?limit=6&status=active');
      setFeaturedProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to products page with search query
      history.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div>
      <Jumbotron className="bg-primary text-white">
        <Container>
          <Row className="justify-content-center">
            <Col lg="8" className="text-center">
              <h1 className="display-4 mb-4">Welcome to E-Commerce Platform</h1>
              <p className="lead mb-4">
                Discover amazing products from trusted sellers worldwide
              </p>
              
              {/* Search Bar */}
              <Form onSubmit={handleSearch} className="mb-4">
                <Row className="justify-content-center">
                  <Col md="8" lg="6">
                    <div className="position-relative">
                      <Input
                        type="text"
                        placeholder="Search for products..."
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        className="pr-5"
                        style={{
                          borderRadius: '50px',
                          padding: '12px 20px',
                          fontSize: '16px',
                          border: 'none'
                        }}
                      />
                      <Button
                        type="submit"
                        color="success"
                        className="position-absolute"
                        style={{
                          right: '3px',
                          top: '3px',
                          bottom: '3px',
                          borderRadius: '50px',
                          minWidth: '80px'
                        }}
                      >
                        <i className="fas fa-search"></i>
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
              
              <div>
                <Button color="light" size="lg" tag={Link} to="/products" className="mr-3">
                  Browse All Products
                </Button>
                <Button color="outline-light" size="lg" tag={Link} to="/seller/register">
                  Become a Seller
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </Jumbotron>

      <Container>
        <Row className="mb-5">
          <Col md="4" className="text-center mb-4">
            <div className="mb-3">
              <i className="fas fa-shipping-fast fa-3x text-primary"></i>
            </div>
            <h4>Fast Shipping</h4>
            <p>Quick and reliable delivery to your doorstep</p>
          </Col>
          <Col md="4" className="text-center mb-4">
            <div className="mb-3">
              <i className="fas fa-shield-alt fa-3x text-primary"></i>
            </div>
            <h4>Secure Shopping</h4>
            <p>Your data and transactions are always protected</p>
          </Col>
          <Col md="4" className="text-center mb-4">
            <div className="mb-3">
              <i className="fas fa-headset fa-3x text-primary"></i>
            </div>
            <h4>24/7 Support</h4>
            <p>Get help whenever you need it</p>
          </Col>
        </Row>

        <Row>
          <Col>
            <h2 className="text-center mb-4">Featured Products</h2>
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : (
              <Row>
                {featuredProducts.map(product => (
                  <Col md="4" key={product.id} className="mb-4">
                    <Card className="product-card h-100">
                      <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
                        {product.images && product.images.length > 0 ? (
                          product.images[0].media_id ? (
                            <SecureImage 
                              mediaId={product.images[0].media_id}
                              alt={product.name}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                position: 'absolute',
                                top: 0,
                                left: 0
                              }}
                            />
                          ) : product.images[0].url ? (
                            <img 
                              src={product.images[0].url}
                              alt={product.name}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                position: 'absolute',
                                top: 0,
                                left: 0
                              }}
                            />
                          ) : (
                            <div 
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                backgroundColor: '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#6c757d',
                                fontSize: '14px'
                              }}
                            >
                              No Image
                            </div>
                          )
                        ) : (
                          <div 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              backgroundColor: '#f8f9fa',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6c757d',
                              fontSize: '14px'
                            }}
                          >
                            No Image Available
                          </div>
                        )}
                      </div>
                      <CardBody className="d-flex flex-column">
                        <CardTitle tag="h5">{product.name}</CardTitle>
                        <CardText className="text-muted">
                          {product.description ? product.description.substring(0, 80) + '...' : 'No description available'}
                        </CardText>
                        <CardText className="h5 text-primary mt-auto">
                          ${product.price}
                        </CardText>
                        <Button 
                          color="primary" 
                          tag={Link} 
                          to={`/product/${product.id}`}
                        >
                          View Details
                        </Button>
                      </CardBody>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
            {!loading && featuredProducts.length === 0 && (
              <div className="text-center">
                <p>No products available at the moment.</p>
                <Button color="primary" tag={Link} to="/seller/register">
                  Become a Seller
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;