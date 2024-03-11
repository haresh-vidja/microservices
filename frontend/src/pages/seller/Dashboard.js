import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardTitle, CardText, Button, Table, Badge } from 'reactstrap';
import { useHistory } from 'react-router-dom';
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
    if (!token) {
      history.push('/seller/login');
      return;
    }
    fetchDashboardData();
  }, [history]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [sellerRes, productsRes, ordersRes] = await Promise.all([
        axios.get('http://localhost:3002/api/v1/sellers/profile', { headers }),
        axios.get('/api/products?sellerId=' + JSON.parse(localStorage.getItem('sellerData'))?.id, { headers }),
        axios.get('/api/orders?sellerId=' + JSON.parse(localStorage.getItem('sellerData'))?.id, { headers })
      ]);

      if (sellerRes.data.success) {
        setSeller(sellerRes.data.data);
      }

      if (productsRes.data.success) {
        setProducts(productsRes.data.data.products || []);
        setStats(prev => ({
          ...prev,
          totalProducts: (productsRes.data.data.products || []).length
        }));
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
      if (error.response?.status === 401) {
        localStorage.removeItem('sellerToken');
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
      <Container className="py-5">
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
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
                <h5>Recent Products</h5>
                <Button color="primary" size="sm">
                  Add Product
                </Button>
              </div>
              {products.length > 0 ? (
                <Table responsive size="sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 5).map(product => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>${product.price}</td>
                        <td>{product.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No products added yet.</p>
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
    </Container>
  );
};

export default SellerDashboard;