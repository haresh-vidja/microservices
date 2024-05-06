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
  ModalFooter
} from 'reactstrap';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout';
import { toast } from 'react-toastify';

const AdminSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchSellers();
  }, [currentPage, filterStatus]);

  // Add search on Enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setCurrentPage(1); // Reset to first page on search
      fetchSellers();
    }
  };

  const handleSearchClick = () => {
    setCurrentPage(1); // Reset to first page on search
    fetchSellers();
  };

  const fetchSellers = async () => {
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

      const response = await axios.get('/api/admin/proxy/sellers/api/v1/sellers/admin', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setSellers(response.data.data.sellers || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Failed to fetch sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (sellerId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`/api/admin/proxy/sellers/api/v1/sellers/admin/${sellerId}/status`, {
        isActive: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Seller status updated successfully');
      fetchSellers();
    } catch (error) {
      console.error('Error updating seller status:', error);
      toast.error('Failed to update seller status');
    }
  };


  const handleViewDetails = (seller) => {
    setSelectedSeller(seller);
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

  const getVerificationBadge = (isVerified) => {
    return isVerified ? 
      <Badge color="success">Verified</Badge> : 
      <Badge color="warning">Pending</Badge>;
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Seller Management</h1>
          <p className="text-muted">Manage and monitor seller accounts</p>
        </div>
        <Button color="primary" onClick={fetchSellers}>
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
                  placeholder="Search by name, email, or business name..."
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
                {sellers.length} seller{sellers.length !== 1 ? 's' : ''}
              </span>
            </Col>
          </Row>

          {/* Sellers Table */}
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
                    <th>Seller</th>
                    <th>Business</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller) => (
                    <tr key={seller.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mr-3"
                               style={{ width: '40px', height: '40px' }}>
                            {seller.firstName?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <div className="font-weight-medium">
                              {seller.firstName} {seller.lastName}
                            </div>
                            <small className="text-muted">ID: {seller.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-weight-medium">{seller.businessName}</div>
                        <small className="text-muted text-capitalize">
                          {seller.businessType}
                        </small>
                      </td>
                      <td>
                        <div>{seller.email}</div>
                        {seller.phone && (
                          <small className="text-muted">{seller.phone}</small>
                        )}
                      </td>
                      <td>
                        <div className="mb-1">
                          {getStatusBadge(seller.isActive)}
                        </div>
                        {getVerificationBadge(seller.isVerified)}
                      </td>
                      <td>{formatDate(seller.createdAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            size="sm"
                            color="info" 
                            onClick={() => handleViewDetails(seller)}
                            title="View Details"
                          >
                            <i className="fas fa-eye me-1"></i>
                            View
                          </Button>
                          <Button 
                            size="sm"
                            color={seller.isActive ? 'warning' : 'success'}
                            onClick={() => handleStatusToggle(seller.id, seller.isActive)}
                            title={seller.isActive ? 'Deactivate Seller' : 'Activate Seller'}
                            disabled={loading}
                          >
                            <i className={`fas fa-${seller.isActive ? 'user-slash' : 'user-check'} me-1`}></i>
                            {seller.isActive ? 'Deactivate' : 'Activate'}
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

      {/* Seller Details Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setModalOpen(false)}>
          Seller Details
        </ModalHeader>
        <ModalBody>
          {selectedSeller && (
            <Row>
              <Col md="6">
                <h6>Personal Information</h6>
                <p><strong>Name:</strong> {selectedSeller.firstName} {selectedSeller.lastName}</p>
                <p><strong>Email:</strong> {selectedSeller.email}</p>
                <p><strong>Phone:</strong> {selectedSeller.phone || 'Not provided'}</p>
              </Col>
              <Col md="6">
                <h6>Business Information</h6>
                <p><strong>Business Name:</strong> {selectedSeller.businessName}</p>
                <p><strong>Business Type:</strong> {selectedSeller.businessType}</p>
                <p><strong>Description:</strong> {selectedSeller.businessDescription || 'Not provided'}</p>
              </Col>
              <Col md="12">
                <h6>Address</h6>
                {selectedSeller.address ? (
                  <p>
                    {selectedSeller.address.street}, {selectedSeller.address.city}, {' '}
                    {selectedSeller.address.state}, {selectedSeller.address.country} {' '}
                    {selectedSeller.address.postalCode}
                  </p>
                ) : (
                  <p>No address provided</p>
                )}
              </Col>
              <Col md="6">
                <h6>Account Status</h6>
                <p><strong>Status:</strong> {getStatusBadge(selectedSeller.isActive)}</p>
                <p><strong>Verification:</strong> {getVerificationBadge(selectedSeller.isVerified)}</p>
              </Col>
              <Col md="6">
                <h6>Account Information</h6>
                <p><strong>Member Since:</strong> {formatDate(selectedSeller.createdAt)}</p>
                <p><strong>Last Updated:</strong> {formatDate(selectedSeller.updatedAt)}</p>
                <p><strong>Seller ID:</strong> {selectedSeller.id}</p>
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

export default AdminSellers;