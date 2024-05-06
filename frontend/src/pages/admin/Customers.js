import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  CardBody, 
  CardTitle, 
  Table,
  Badge,
  Button,
  InputGroup,
  Input,
  ButtonGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label
} from 'reactstrap';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout';
import { toast } from 'react-toastify';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, filterStatus]);

  // Add search on Enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setCurrentPage(1); // Reset to first page on search
      fetchCustomers();
    }
  };

  const handleSearchClick = () => {
    setCurrentPage(1); // Reset to first page on search
    fetchCustomers();
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const params = {
        page: currentPage,
        limit: 10
      };
      
      // Only add search if it has value
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      // Only add status if not 'all'
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await axios.get('/api/admin/proxy/customer/api/v1/customers/admin', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setCustomers(response.data.data.customers || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (customerId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`/api/admin/proxy/customer/api/v1/customers/admin/${customerId}/status`, {
        isActive: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Customer status updated successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast.error('Failed to update customer status');
    }
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (isActive) => {
    return isActive ? 
      <Badge color="success">Active</Badge> : 
      <Badge color="danger">Inactive</Badge>;
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Customer Management</h1>
          <p className="text-muted">Manage and monitor customer accounts</p>
        </div>
        <Button color="primary" onClick={fetchCustomers}>
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardBody>
          {/* Filters and Search */}
          <Row className="mb-3">
            <Col md="6">
              <InputGroup>
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
                <Button color="primary" onClick={handleSearchClick}>
                  <i className="fas fa-search me-2"></i>
                  Search
                </Button>
              </InputGroup>
            </Col>
            <Col md="3">
              <ButtonGroup>
                <Button
                  color={filterStatus === 'all' ? 'primary' : 'outline-primary'}
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </Button>
                <Button
                  color={filterStatus === 'active' ? 'success' : 'outline-success'}
                  onClick={() => setFilterStatus('active')}
                >
                  Active
                </Button>
                <Button
                  color={filterStatus === 'inactive' ? 'danger' : 'outline-danger'}
                  onClick={() => setFilterStatus('inactive')}
                >
                  Inactive
                </Button>
              </ButtonGroup>
            </Col>
            <Col md="3" className="text-right">
              <span className="text-muted">
                {customers.length} customer{customers.length !== 1 ? 's' : ''}
              </span>
            </Col>
          </Row>

          {/* Customers Table */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <Table responsive hover>
                <thead className="table-light">
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mr-3"
                               style={{ width: '40px', height: '40px' }}>
                            {customer.firstName?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div className="font-weight-medium">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <small className="text-muted">ID: {customer.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{customer.email}</div>
                        {customer.phone && (
                          <small className="text-muted">{customer.phone}</small>
                        )}
                      </td>
                      <td>
                        {getStatusBadge(customer.isActive)}
                        {customer.emailVerified && (
                          <Badge color="info" className="ml-1">Verified</Badge>
                        )}
                      </td>
                      <td>{formatDate(customer.createdAt)}</td>
                      <td>{formatDate(customer.updatedAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            size="sm"
                            color="info" 
                            onClick={() => handleViewDetails(customer)}
                            title="View Details"
                          >
                            <i className="fas fa-eye me-1"></i>
                            View
                          </Button>
                          <Button 
                            size="sm"
                            color={customer.isActive ? 'warning' : 'success'}
                            onClick={() => handleStatusToggle(customer.id, customer.isActive)}
                            title={customer.isActive ? 'Deactivate Customer' : 'Activate Customer'}
                            disabled={loading}
                          >
                            <i className={`fas fa-${customer.isActive ? 'user-slash' : 'user-check'} me-1`}></i>
                            {customer.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <Button
                    color="outline-primary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <Button
                    color="outline-primary"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Customer Details Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setModalOpen(false)}>
          Customer Details
        </ModalHeader>
        <ModalBody>
          {selectedCustomer && (
            <Row>
              <Col md="6">
                <h6>Personal Information</h6>
                <p><strong>Name:</strong> {selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                <p><strong>Phone:</strong> {selectedCustomer.phone || 'Not provided'}</p>
                <p><strong>Date of Birth:</strong> {formatDate(selectedCustomer.dateOfBirth)}</p>
                <p><strong>Gender:</strong> {selectedCustomer.gender || 'Not specified'}</p>
              </Col>
              <Col md="6">
                <h6>Account Information</h6>
                <p><strong>Status:</strong> {getStatusBadge(selectedCustomer.isActive)}</p>
                <p><strong>Email Verified:</strong> {selectedCustomer.emailVerified ? 
                  <Badge color="success">Yes</Badge> : <Badge color="warning">No</Badge>}
                </p>
                <p><strong>Member Since:</strong> {formatDate(selectedCustomer.createdAt)}</p>
                <p><strong>Last Updated:</strong> {formatDate(selectedCustomer.updatedAt)}</p>
                <p><strong>Customer ID:</strong> {selectedCustomer.id}</p>
              </Col>
            </Row>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </AdminLayout>
  );
};

export default AdminCustomers;