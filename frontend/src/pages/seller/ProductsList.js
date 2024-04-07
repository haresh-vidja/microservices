import React, { useState, useEffect } from 'react';
import { Table, Button, Card, CardBody, Badge, Input, InputGroup, InputGroupAddon, InputGroupText, Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerId = JSON.parse(localStorage.getItem('sellerInfo') || '{}').id;
      
      const response = await axios.get(`/api/products/products?sellerId=${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProducts(response.data.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('sellerToken');
        await axios.delete(`/api/products/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) return <Badge color="danger">Out of Stock</Badge>;
    if (stock < 10) return <Badge color="warning">Low Stock ({stock})</Badge>;
    return <Badge color="success">In Stock ({stock})</Badge>;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Products</h2>
        <Button color="success" tag={Link} to="/seller/add-product">
          <span className="mr-2">➕</span> Add New Product
        </Button>
      </div>

      <Card className="mb-4">
        <CardBody>
          <Row>
            <Col md="6">
              <InputGroup>
                <InputGroupAddon addonType="prepend">
                  <InputGroupText>🔍</InputGroupText>
                </InputGroupAddon>
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md="4">
              <Input
                type="select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports</option>
                <option value="beauty">Beauty</option>
                <option value="toys">Toys</option>
                <option value="automotive">Automotive</option>
              </Input>
            </Col>
            <Col md="2">
              <div className="text-right">
                <Badge color="info" pill className="p-2">
                  Total: {filteredProducts.length} products
                </Badge>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {filteredProducts.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product._id}>
                    <td>
                      {product.mainImage ? (
                        <img 
                          src={product.mainImage} 
                          alt={product.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          className="rounded"
                        />
                      ) : (
                        <div className="bg-light rounded d-flex align-items-center justify-content-center" 
                             style={{ width: '50px', height: '50px' }}>
                          📦
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{product.name}</strong>
                      <br />
                      <small className="text-muted">ID: {product._id.slice(-8)}</small>
                    </td>
                    <td>
                      <Badge color="secondary">{product.category}</Badge>
                    </td>
                    <td>${product.price}</td>
                    <td>{getStockBadge(product.stock)}</td>
                    <td>
                      {product.isActive ? (
                        <Badge color="success">Active</Badge>
                      ) : (
                        <Badge color="danger">Inactive</Badge>
                      )}
                    </td>
                    <td>
                      <Button
                        color="primary"
                        size="sm"
                        tag={Link}
                        to={`/seller/edit-product/${product._id}`}
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => handleDelete(product._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <h5 className="text-muted">No products found</h5>
              <p className="text-muted">Start by adding your first product</p>
              <Button color="success" tag={Link} to="/seller/add-product">
                Add Product
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ProductsList;