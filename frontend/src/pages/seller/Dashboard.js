import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, CardTitle, CardText, Button, Table, Badge } from 'reactstrap';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';

const SellerDashboard = () => {
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem('sellerToken');
    console.log('Dashboard loading, token:', token ? 'exists' : 'missing');
    if (!token) {
      console.log('No token found, redirecting to login');
      history.push('/seller/login');
      return;
    }
    console.log('Token found, fetching dashboard data');
    fetchDashboardData();
  }, [history]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const sellerData = JSON.parse(localStorage.getItem('sellerData')) || {};
      let sellerId = sellerData.id;
      
      // Fallback: extract seller ID from JWT token if not in localStorage
      if (!sellerId && token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          sellerId = tokenPayload.id;
          console.log('Dashboard: Extracted seller ID from JWT token:', sellerId);
        } catch (e) {
          console.error('Dashboard: Failed to extract seller ID from token:', e);
        }
      }
      
      // Debug: Always extract and log JWT token info for comparison
      if (token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          console.log('Dashboard: JWT token payload:', tokenPayload);
          console.log('Dashboard: JWT seller ID:', tokenPayload.id);
          console.log('Dashboard: localStorage seller ID:', sellerData.id);
        } catch (e) {
          console.error('Dashboard: Failed to parse JWT token for debugging:', e);
        }
      }
      
      console.log('Dashboard: sellerData:', sellerData);
      console.log('Dashboard: sellerId:', sellerId);
      console.log('Dashboard: expected alex.tech sellerId should be: 6895fc2fc8976794b14a5fce');
      
      if (!sellerId) {
        console.error('Dashboard: No seller ID found in localStorage or token');
        setProducts([]);
        setStats(prev => ({ ...prev, totalProducts: 0 }));
        setLoading(false);
        return;
      }
      
      const productsUrl = `/api/products/products/seller/${sellerId}?limit=10&status=active`;
      console.log('Dashboard: Fetching products from:', productsUrl);
      
      const [sellerRes, productsRes, ordersRes] = await Promise.all([
        axios.get('http://localhost:3002/api/v1/sellers/profile', { headers }),
        axios.get(productsUrl, { headers }),
        axios.get('/api/orders?sellerId=' + sellerId, { headers })
      ]);

      if (sellerRes.data.success) {
        setSeller(sellerRes.data.data);
      }

      console.log('Dashboard: Products API response:', productsRes.data);
      
      if (productsRes.data.success) {
        const products = productsRes.data.data.products || [];
        console.log('Dashboard: Products fetched successfully:', products.length, 'products');
        console.log('Dashboard: Product details:', products.map(p => ({ id: p.id, name: p.name, isActive: p.isActive })));
        setProducts(products);
        setStats(prev => ({
          ...prev,
          totalProducts: productsRes.data.data.summary?.total || products.length
        }));
      } else {
        console.error('Dashboard: Failed to fetch products:', productsRes.data);
        setProducts([]);
      }

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
        const totalSales = ordersRes.data.data
          .filter(order => order.status === 'delivered')
          .reduce((sum, order) => sum + order.totalAmount, 0);
        
        setStats(prev => ({
          ...prev,
          totalOrders: ordersRes.data.data.length,
          totalSales
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.log('Error details:', error.response?.data);
      if (error.response?.status === 401) {
        console.log('401 error, removing token and redirecting');
        localStorage.removeItem('sellerToken');
        localStorage.removeItem('sellerData');
        history.push('/seller/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

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
      <Row>
        <Col>
          <h2 className="mb-4">Seller Dashboard</h2>
          {seller && (
            <p className="lead">Welcome back, {seller.businessName}!</p>
          )}
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md="4">
          <Card className="text-center">
            <CardBody>
              <CardTitle tag="h5">Total Products</CardTitle>
              <CardText className="h3 text-primary">
                {stats.totalProducts}
              </CardText>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card className="text-center">
            <CardBody>
              <CardTitle tag="h5">Total Orders</CardTitle>
              <CardText className="h3 text-info">
                {stats.totalOrders}
              </CardText>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card className="text-center">
            <CardBody>
              <CardTitle tag="h5">Total Sales</CardTitle>
              <CardText className="h3 text-success">
                ${stats.totalSales.toFixed(2)}
              </CardText>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md="6">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Recent Products ({products.length > 0 ? `${products.length} active` : '0'})</h5>
                <div>
                  <Button color="outline-primary" size="sm" tag={Link} to="/seller/products" className="mr-2">
                    View All
                  </Button>
                  <Button color="primary" size="sm" tag={Link} to="/seller/add-product">
                    Add Product
                  </Button>
                </div>
              </div>
              {products.length > 0 ? (
                <Table responsive size="sm">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 5).map(product => (
                      <tr key={product.id}>
                        <td>
                          <div>
                            <strong>{product.name}</strong>
                            <br />
                            <small className="text-muted">{product.category}</small>
                          </div>
                        </td>
                        <td><strong>${product.price}</strong></td>
                        <td>
                          <Badge color={product.stock <= product.lowStockAlert ? 'warning' : 'success'}>
                            {product.stock} units
                          </Badge>
                        </td>
                        <td>
                          <Badge color="success">Active</Badge>
                        </td>
                        <td>
                          <Button
                            color="primary"
                            size="sm"
                            tag={Link}
                            to={`/seller/edit-product/${product.id}`}
                            className="btn-sm"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">No active products found.</p>
                  <Button color="primary" size="sm" tag={Link} to="/seller/add-product">
                    Add Your First Product
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col md="6">
          <Card>
            <CardBody>
              <h5 className="mb-3">Recent Orders</h5>
              {orders.length > 0 ? (
                <Table responsive size="sm">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order._id}>
                        <td>{order._id.slice(-8)}</td>
                        <td>${order.totalAmount}</td>
                        <td>
                          <Badge color={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No orders received yet.</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SellerDashboard;