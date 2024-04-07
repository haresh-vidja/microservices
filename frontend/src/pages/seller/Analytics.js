import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Table, Badge } from 'reactstrap';
import axios from 'axios';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    topProducts: [],
    recentOrders: [],
    monthlyRevenue: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerId = JSON.parse(localStorage.getItem('sellerInfo') || '{}').id;
      
      // Simulate analytics data - replace with actual API calls
      setStats({
        totalRevenue: 15234.50,
        totalOrders: 143,
        totalProducts: 28,
        averageOrderValue: 106.57,
        topProducts: [
          { name: 'Product 1', sales: 45, revenue: 2250 },
          { name: 'Product 2', sales: 38, revenue: 1900 },
          { name: 'Product 3', sales: 32, revenue: 1600 },
          { name: 'Product 4', sales: 28, revenue: 1400 },
          { name: 'Product 5', sales: 24, revenue: 1200 }
        ],
        recentOrders: [
          { id: 'ORD001', date: new Date(), amount: 125.50, status: 'delivered' },
          { id: 'ORD002', date: new Date(), amount: 89.99, status: 'shipped' },
          { id: 'ORD003', date: new Date(), amount: 234.00, status: 'processing' },
          { id: 'ORD004', date: new Date(), amount: 67.50, status: 'pending' },
          { id: 'ORD005', date: new Date(), amount: 156.25, status: 'delivered' }
        ],
        monthlyRevenue: [
          { month: 'Jan', revenue: 2500 },
          { month: 'Feb', revenue: 3200 },
          { month: 'Mar', revenue: 2800 },
          { month: 'Apr', revenue: 3500 },
          { month: 'May', revenue: 2900 },
          { month: 'Jun', revenue: 3334.50 }
        ]
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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
      <h2 className="mb-4">Analytics Dashboard</h2>

      <Row className="mb-4">
        <Col md="3">
          <Card className="text-center bg-primary text-white">
            <CardBody>
              <h3>${stats.totalRevenue.toFixed(2)}</h3>
              <p className="mb-0">Total Revenue</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card className="text-center bg-success text-white">
            <CardBody>
              <h3>{stats.totalOrders}</h3>
              <p className="mb-0">Total Orders</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card className="text-center bg-info text-white">
            <CardBody>
              <h3>{stats.totalProducts}</h3>
              <p className="mb-0">Active Products</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card className="text-center bg-warning text-white">
            <CardBody>
              <h3>${stats.averageOrderValue.toFixed(2)}</h3>
              <p className="mb-0">Avg. Order Value</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md="6">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Top Selling Products</CardTitle>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sales</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>{product.sales}</td>
                      <td>${product.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>

        <Col md="6">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Recent Orders</CardTitle>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order, index) => (
                    <tr key={index}>
                      <td>{order.id}</td>
                      <td>{order.date.toLocaleDateString()}</td>
                      <td>${order.amount.toFixed(2)}</td>
                      <td>
                        <Badge color={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'shipped' ? 'info' :
                          order.status === 'processing' ? 'primary' : 'warning'
                        }>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <CardBody>
              <CardTitle tag="h5">Monthly Revenue Trend</CardTitle>
              <div className="d-flex justify-content-around align-items-end" style={{ height: '200px' }}>
                {stats.monthlyRevenue.map((data, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className="bg-primary"
                      style={{
                        width: '60px',
                        height: `${(data.revenue / 3500) * 150}px`,
                        marginBottom: '10px'
                      }}
                    ></div>
                    <small>{data.month}</small>
                    <br />
                    <small className="text-muted">${data.revenue}</small>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;