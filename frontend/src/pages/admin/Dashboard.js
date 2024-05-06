import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  CardBody, 
  CardTitle, 
  Table,
  Badge,
  Progress,
  Button
} from 'reactstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    customers: { total: 0, active: 0 },
    sellers: { total: 0, active: 0 },
    products: { total: 0 },
    orders: { total: 0 }
  });
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchServicesHealth();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.data.overview);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicesHealth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/services/health', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setServices(response.data.data.services);
      }
    } catch (error) {
      console.error('Error fetching services health:', error);
    }
  };

  const getServiceStatusBadge = (service) => {
    if (service.status === 'healthy') {
      return <Badge color="success">Healthy</Badge>;
    }
    return <Badge color="danger">Unhealthy</Badge>;
  };

  const StatCard = ({ title, value, subValue, color, icon, link }) => (
    <Card className="h-100 shadow-sm">
      <CardBody>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <CardTitle tag="h6" className="text-muted mb-1">{title}</CardTitle>
            <h2 className={`mb-0 text-${color}`}>{loading ? '...' : value}</h2>
            {subValue && (
              <small className="text-muted">{subValue} active</small>
            )}
          </div>
          <div className={`text-${color} opacity-75`}>
            <i className={`${icon} fa-2x`}></i>
          </div>
        </div>
        {link && (
          <div className="mt-3">
            <Button tag={Link} to={link} color={color} size="sm" outline>
              Manage
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Admin Dashboard</h1>
          <p className="text-muted">Platform overview and system monitoring</p>
        </div>
        <Button color="primary" onClick={() => { fetchDashboardData(); fetchServicesHealth(); }}>
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md="3" className="mb-3">
          <StatCard
            title="Total Customers"
            value={stats.customers.total}
            subValue={stats.customers.active}
            color="info"
            icon="fas fa-users"
            link="/admin/customers"
          />
        </Col>
        <Col md="3" className="mb-3">
          <StatCard
            title="Total Sellers"
            value={stats.sellers.total}
            subValue={stats.sellers.active}
            color="success"
            icon="fas fa-store"
            link="/admin/sellers"
          />
        </Col>
        <Col md="3" className="mb-3">
          <StatCard
            title="Total Products"
            value={stats.products.total}
            color="primary"
            icon="fas fa-box"
            link="/admin/products"
          />
        </Col>
        <Col md="3" className="mb-3">
          <StatCard
            title="Total Orders"
            value={stats.orders.total}
            color="warning"
            icon="fas fa-shopping-cart"
            link="/admin/orders"
          />
        </Col>
      </Row>

      {/* Services Health */}
      <Row>
        <Col md="6" className="mb-4">
          <Card className="shadow-sm">
            <CardBody>
              <CardTitle tag="h5">
                <i className="fas fa-server mr-2"></i>
                Services Health
              </CardTitle>
              <Table responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(services).map(([serviceName, service]) => (
                    <tr key={serviceName}>
                      <td className="text-capitalize font-weight-medium">
                        {serviceName}
                      </td>
                      <td>
                        {getServiceStatusBadge(service)}
                      </td>
                      <td>
                        {service.responseTime || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>

        <Col md="6" className="mb-4">
          <Card className="shadow-sm">
            <CardBody>
              <CardTitle tag="h5">
                <i className="fas fa-chart-pie mr-2"></i>
                Platform Activity
              </CardTitle>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Active Customers</span>
                  <span>{stats.customers.active}/{stats.customers.total}</span>
                </div>
                <Progress 
                  value={stats.customers.total ? (stats.customers.active / stats.customers.total) * 100 : 0} 
                  color="info" 
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Active Sellers</span>
                  <span>{stats.sellers.active}/{stats.sellers.total}</span>
                </div>
                <Progress 
                  value={stats.sellers.total ? (stats.sellers.active / stats.sellers.total) * 100 : 0} 
                  color="success" 
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Platform Health</span>
                  <span>
                    {Object.values(services).filter(s => s.status === 'healthy').length}/
                    {Object.keys(services).length}
                  </span>
                </div>
                <Progress 
                  value={Object.keys(services).length ? 
                    (Object.values(services).filter(s => s.status === 'healthy').length / Object.keys(services).length) * 100 
                    : 0} 
                  color="warning" 
                />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <CardBody>
              <CardTitle tag="h5">
                <i className="fas fa-bolt mr-2"></i>
                Quick Actions
              </CardTitle>
              <Row>
                <Col md="3" className="mb-2">
                  <Button tag={Link} to="/admin/customers" color="info" block outline>
                    <i className="fas fa-users mr-2"></i>
                    Manage Customers
                  </Button>
                </Col>
                <Col md="3" className="mb-2">
                  <Button tag={Link} to="/admin/sellers" color="success" block outline>
                    <i className="fas fa-store mr-2"></i>
                    Manage Sellers
                  </Button>
                </Col>
                <Col md="3" className="mb-2">
                  <Button tag={Link} to="/admin/products" color="primary" block outline>
                    <i className="fas fa-box mr-2"></i>
                    Manage Products
                  </Button>
                </Col>
                <Col md="3" className="mb-2">
                  <Button tag={Link} to="/admin/orders" color="warning" block outline>
                    <i className="fas fa-shopping-cart mr-2"></i>
                    Manage Orders
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
};

export default AdminDashboard;