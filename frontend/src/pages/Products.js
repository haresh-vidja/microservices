import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardImg, CardBody, CardTitle, CardText, Button, Input, FormGroup, Label } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import SecureImage from '../components/common/SecureImage';
import cartService from '../services/cartService';

const Products = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Initialize search state from URL parameters
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search');
    const categoryParam = urlParams.get('category');
    
    if (searchParam) {
      setSearch(searchParam);
    }
    if (categoryParam) {
      setCategory(categoryParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
  }, [search, category, sortBy, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        sort: sortBy,
        status: 'active', // Only show active products
        ...(search && { search }),
        ...(category && { category })
      };

      const response = await axios.get('/api/products/products', { params });
      
      if (response.data.success) {
        setProducts(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    try {
      await cartService.addToCart(product, 1);
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Products</h2>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md="4">
          <FormGroup>
            <Label for="search">Search Products</Label>
            <Input
              type="text"
              id="search"
              placeholder="Search by name or description..."
              value={search}
              onChange={handleSearchChange}
            />
          </FormGroup>
        </Col>
        <Col md="4">
          <FormGroup>
            <Label for="category">Category</Label>
            <Input
              type="select"
              id="category"
              value={category}
              onChange={handleCategoryChange}
            >
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
              <option value="home">Home & Garden</option>
              <option value="sports">Sports</option>
              <option value="beauty">Beauty</option>
            </Input>
          </FormGroup>
        </Col>
        <Col md="4">
          <FormGroup>
            <Label for="sort">Sort By</Label>
            <Input
              type="select"
              id="sort"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="name">Name</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
            </Input>
          </FormGroup>
        </Col>
      </Row>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <Row>
            {products.map(product => (
              <Col md="4" lg="3" key={product.id} className="mb-4">
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
                    <CardTitle tag="h6">{product.name}</CardTitle>
                    <CardText className="text-muted small">
                      {product.description?.substring(0, 100)}...
                    </CardText>
                    <CardText className="h6 text-primary">
                      ${product.price}
                    </CardText>
                    <CardText className="small text-muted">
                      Stock: {product.stock}
                    </CardText>
                    <div className="mt-auto">
                      <Button 
                        color="primary" 
                        size="sm" 
                        block
                        tag={Link} 
                        to={`/product/${product.id}`}
                        className="mb-2"
                      >
                        View Details
                      </Button>
                      <Button 
                        color="success" 
                        size="sm" 
                        block
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>

          {products.length === 0 && (
            <Row>
              <Col className="text-center py-5">
                <p className="lead">No products found.</p>
              </Col>
            </Row>
          )}

          {totalPages > 1 && (
            <Row>
              <Col className="d-flex justify-content-center">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <Button 
                        color="link" 
                        className="page-link"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                        <Button 
                          color="link" 
                          className="page-link"
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      </li>
                    ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <Button 
                        color="link" 
                        className="page-link"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </li>
                  </ul>
                </nav>
              </Col>
            </Row>
          )}
        </>
      )}
    </Container>
  );
};

export default Products;