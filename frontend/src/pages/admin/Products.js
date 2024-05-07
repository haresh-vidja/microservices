import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  CardBody, 
  
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

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterStatus]);

  // Add search on Enter key
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setCurrentPage(1); // Reset to first page on search
      fetchProducts();
    }
  };

  const handleSearchClick = () => {
    setCurrentPage(1); // Reset to first page on search
    fetchProducts();
  };

  const fetchProducts = async () => {
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

      const response = await axios.get('/api/admin/proxy/products/api/v1/products/admin', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        const productsData = response.data.data.products || [];
        setProducts(productsData);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
        
        // Extract unique seller IDs
        const sellerIds = [...new Set(productsData
          .map(p => p.sellerId)
          .filter(id => id && id !== null))];
        
        
        if (sellerIds.length > 0) {
          // Fetch seller information
          try {
            const sellersResponse = await axios.post('/api/admin/proxy/sellers/api/v1/sellers/service/bulk', 
              { sellerIds },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (sellersResponse.data.success) {
              // Create a map of sellerId to seller info
              const sellersMap = {};
              sellersResponse.data.data.forEach(seller => {
                // Products use MongoDB _id, but sellers API might return 'id' or '_id'
                // Map both to ensure we can find sellers regardless of which field is used
                const sellerId = seller._id || seller.id;
                if (sellerId) {
                  sellersMap[sellerId] = seller;
                  // Also map the other format for redundancy
                  if (seller.id && seller._id) {
                    sellersMap[seller.id] = seller;
                  }
                }
              });
              setSellers(sellersMap);
            }
          } catch (sellerError) {
            console.error('Error fetching sellers:', sellerError);
            // Continue without seller names
          }
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (productId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`/api/admin/proxy/products/api/v1/products/admin/${productId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Product status updated successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { color: 'success', text: 'Active' },
      inactive: { color: 'secondary', text: 'Inactive' },
      pending: { color: 'warning', text: 'Pending' },
      rejected: { color: 'danger', text: 'Rejected' },
      out_of_stock: { color: 'info', text: 'Out of Stock' }
    };
    
    const statusInfo = statusMap[status] || { color: 'secondary', text: status };
    return <Badge color={statusInfo.color}>{statusInfo.text}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Product Management</h1>
          <p className="text-muted">Monitor and manage all products</p>
        </div>
        <Button color="primary" onClick={fetchProducts}>
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
                  placeholder="Search by product name, category, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                <Button color="primary" onClick={handleSearchClick}>
                  <i className="fas fa-search me-2"></i>
                  Search
                </Button>
              </InputGroup>
            </Col>
            <Col md="4">
              <ButtonGroup>
                <Button
                  color={filterStatus === 'all' ? 'primary' : 'outline-primary'}
                  onClick={() => setFilterStatus('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  color={filterStatus === 'active' ? 'success' : 'outline-success'}
                  onClick={() => setFilterStatus('active')}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  color={filterStatus === 'pending' ? 'warning' : 'outline-warning'}
                  onClick={() => setFilterStatus('pending')}
                  size="sm"
                >
                  Pending
                </Button>
                <Button
                  color={filterStatus === 'inactive' ? 'secondary' : 'outline-secondary'}
                  onClick={() => setFilterStatus('inactive')}
                  size="sm"
                >
                  Inactive
                </Button>
              </ButtonGroup>
            </Col>
            <Col md="2" className="text-right">
              <span className="text-muted">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
            </Col>
          </Row>

          {/* Products Table */}
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
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Seller</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="mr-3" style={{ width: '50px', height: '50px' }}>
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={`http://localhost:8000/media/${product.images[0].media_id}`}
                                alt={product.name}
                                className="img-thumbnail"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="bg-light d-flex align-items-center justify-content-center"
                                 style={{ 
                                   width: '100%', 
                                   height: '100%', 
                                   display: (!product.images || product.images.length === 0) ? 'flex' : 'none',
                                   fontSize: '12px',
                                   color: '#6c757d'
                                 }}>
                              No Image
                            </div>
                          </div>
                          <div>
                            <div className="font-weight-medium">{product.name}</div>
                            <small className="text-muted">SKU: {product.sku || 'N/A'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-weight-bold">{formatPrice(product.price)}</div>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <small className="text-muted">
                            <s>{formatPrice(product.comparePrice)}</s>
                          </small>
                        )}
                      </td>
                      <td>
                        <span className={product.stock > 0 ? 'text-success' : 'text-danger'}>
                          {product.stock || 0}
                        </span>
                      </td>
                      <td>{getStatusBadge(product.isActive ? 'active' : 'inactive')}</td>
                      <td>
                        <small className="text-muted">
                          {product.sellerId && sellers[product.sellerId] ? 
                           (sellers[product.sellerId].businessName || 
                            (sellers[product.sellerId].firstName && sellers[product.sellerId].lastName ? 
                             `${sellers[product.sellerId].firstName} ${sellers[product.sellerId].lastName}` : 
                             'Seller Name Not Available')) :
                           (product.sellerId ? `Unknown Seller (${product.sellerId.slice(0, 8)}...)` : 'No Seller')}
                        </small>
                      </td>
                      <td>{formatDate(product.createdAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            size="sm"
                            color="info" 
                            onClick={() => handleViewDetails(product)}
                            title="View Details"
                          >
                            <i className="fas fa-eye me-1"></i>
                            View
                          </Button>
                          <Button 
                            size="sm"
                            color={product.isActive ? 'warning' : 'success'}
                            onClick={() => handleStatusUpdate(product._id, product.isActive ? 'inactive' : 'active')}
                            title={product.isActive ? 'Deactivate Product' : 'Activate Product'}
                            disabled={loading}
                          >
                            <i className={`fas fa-${product.isActive ? 'ban' : 'check'} me-1`}></i>
                            {product.isActive ? 'Deactivate' : 'Activate'}
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

      {/* Product Details Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setModalOpen(false)}>
          Product Details
        </ModalHeader>
        <ModalBody>
          {selectedProduct && (
            <Row>
              <Col md="6">
                <h6>Product Information</h6>
                <p><strong>Name:</strong> {selectedProduct.name}</p>
                <p><strong>SKU:</strong> {selectedProduct.sku || 'Not provided'}</p>
                <p><strong>Price:</strong> {formatPrice(selectedProduct.price)}</p>
                {selectedProduct.comparePrice && (
                  <p><strong>Compare Price:</strong> {formatPrice(selectedProduct.comparePrice)}</p>
                )}
                <p><strong>Stock:</strong> {selectedProduct.stock || 0}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedProduct.isActive ? 'active' : 'inactive')}</p>
              </Col>
              <Col md="6">
                <h6>Seller & Categories</h6>
                <p><strong>Seller:</strong> {sellers[selectedProduct.sellerId]?.businessName || 
                  (sellers[selectedProduct.sellerId]?.firstName && sellers[selectedProduct.sellerId]?.lastName ? 
                   `${sellers[selectedProduct.sellerId].firstName} ${sellers[selectedProduct.sellerId].lastName}` : 
                   (selectedProduct.sellerId ? `Unknown Seller (ID: ${selectedProduct.sellerId})` : 'No Seller'))}</p>
                <p><strong>Category:</strong> {selectedProduct.category || 'Uncategorized'}</p>
                <p><strong>Subcategory:</strong> {selectedProduct.subcategory || 'None'}</p>
                <p><strong>Tags:</strong> {selectedProduct.tags?.join(', ') || 'None'}</p>
              </Col>
              <Col md="12">
                <h6>Description</h6>
                <p>{selectedProduct.description || 'No description provided'}</p>
              </Col>
              <Col md="12">
                <h6>Specifications</h6>
                {selectedProduct.specifications && selectedProduct.specifications.length > 0 ? (
                  <ul>
                    {selectedProduct.specifications.map((spec, index) => (
                      <li key={index}>
                        <strong>{spec.name}:</strong> {spec.value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No specifications provided</p>
                )}
              </Col>
              <Col md="6">
                <h6>Dates</h6>
                <p><strong>Created:</strong> {formatDate(selectedProduct.createdAt)}</p>
                <p><strong>Updated:</strong> {formatDate(selectedProduct.updatedAt)}</p>
              </Col>
              <Col md="6">
                <h6>Product ID</h6>
                <p><strong>ID:</strong> {selectedProduct._id}</p>
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

export default AdminProducts;