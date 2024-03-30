import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Jumbotron, Button, Card, CardImg, CardBody, CardTitle, CardText } from 'reactstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get('/api/products/products?limit=6');
      setFeaturedProducts(response.data.data?.products || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Jumbotron className="bg-primary text-white">
        <Container>
          <h1 className="display-4">Welcome to E-Commerce Platform</h1>
          <p className="lead">
            Discover amazing products from trusted sellers worldwide
          </p>
          <Button color="light" size="lg" tag={Link} to="/products">
            Shop Now
          </Button>
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
                  <Col md="4" key={product._id} className="mb-4">
                    <Card className="product-card h-100">
                      {product.images && product.images[0] && (
                        <CardImg 
                          top 
                          width="100%" 
                          src={product.images[0]} 
                          alt={product.name}
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                      )}
                      <CardBody className="d-flex flex-column">
                        <CardTitle tag="h5">{product.name}</CardTitle>
                        <CardText className="text-muted">{product.description}</CardText>
                        <CardText className="h5 text-primary mt-auto">
                          ${product.price}
                        </CardText>
                        <Button 
                          color="primary" 
                          tag={Link} 
                          to={`/product/${product._id}`}
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