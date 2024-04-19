import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Card, CardBody, Badge, Input, InputGroup, InputGroupAddon, InputGroupText, 
  Row, Col, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label,
  Progress, Alert, ButtonGroup, Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
  Nav, NavItem, NavLink, TabContent, TabPane
} from 'reactstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import SecureImage from '../../components/common/SecureImage';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals
  const [stockModal, setStockModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Stock management
  const [newStock, setNewStock] = useState('');
  const [stockNotes, setStockNotes] = useState('');
  
  // History data
  const [productHistory, setProductHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Analytics data
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Delete loading state
  const [deletingProducts, setDeletingProducts] = useState(new Set());
  
  // Dropdown states
  const [actionsDropdown, setActionsDropdown] = useState({});
  
  // Active tab for history
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [currentPage, filterStatus, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('sellerData') || '{}');
      
      if (!token || !sellerData.id) {
        toast.error('Please login again');
        return;
      }
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: filterStatus,
        sortBy,
        sortOrder
      });
      
      const response = await axios.get(`/api/products/products/seller/${sellerData.id}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProducts(response.data.data.products || []);
        setSummary(response.data.data.summary || {});
        setPagination(response.data.data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('sellerData') || '{}');
      
      const response = await axios.get(`/api/products/products/seller/${sellerData.id}/analytics?period=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchProductHistory = async (productId, type = 'all') => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('sellerToken');
      
      const params = new URLSearchParams({
        page: 1,
        limit: 50,
        type: type
      });
      
      const response = await axios.get(`/api/products/products/${productId}/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProductHistory(response.data.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching product history:', error);
      toast.error('Failed to load product history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    // Prevent multiple delete requests for the same product
    if (deletingProducts.has(productId)) {
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this product? It will be moved to inactive status and hidden from the main view.')) {
      try {
        const token = localStorage.getItem('sellerToken');
        if (!token) {
          toast.error('Authentication required. Please login again.');
          return;
        }
        
        // Mark as deleting
        setDeletingProducts(prev => new Set([...prev, productId]));
        
        await axios.delete(`/api/products/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product deleted successfully (moved to inactive)');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        
        // More detailed error handling
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.message || 'Failed to delete product';
          toast.error(`Delete failed: ${message}`);
          console.error('Server error:', error.response.status, error.response.data);
        } else if (error.request) {
          // Request was made but no response received
          toast.error('Network error: Unable to connect to server');
          console.error('Network error:', error.request);
        } else {
          // Something else happened
          toast.error('Unexpected error occurred');
          console.error('Unexpected error:', error.message);
        }
      } finally {
        // Remove from deleting set
        setDeletingProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }
    }
  };

  const handleUpdateStock = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      await axios.put(`/api/products/products/${selectedProduct.id}/stock`, {
        stock: parseInt(newStock),
        notes: stockNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Stock updated successfully');
      setStockModal(false);
      setNewStock('');
      setStockNotes('');
      fetchProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setNewStock(product.stock.toString());
    setStockModal(true);
  };

  const openHistoryModal = (product) => {
    setSelectedProduct(product);
    setHistoryModal(true);
    fetchProductHistory(product.id, activeTab);
  };

  const openAnalyticsModal = () => {
    setAnalyticsModal(true);
    fetchAnalytics();
  };

  const toggleActionsDropdown = (productId) => {
    setActionsDropdown(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const getStockBadge = (stock, lowStockAlert = 5) => {
    if (stock === 0) return <Badge color="danger">Out of Stock</Badge>;
    if (stock <= lowStockAlert) return <Badge color="warning">Low Stock ({stock})</Badge>;
    return <Badge color="success">In Stock ({stock})</Badge>;
  };

  const getRevenueDisplay = (revenue) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(revenue || 0);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHistoryTypeIcon = (type) => {
    const icons = {
      sale: '🛒',
      stock_add: '📈',
      stock_reduce: '📉',
      price_change: '💰',
      status_change: '🔄'
    };
    return icons[type] || '📝';
  };

  const getHistoryTypeColor = (type) => {
    const colors = {
      sale: 'success',
      stock_add: 'info',
      stock_reduce: 'warning',
      price_change: 'primary',
      status_change: 'secondary'
    };
    return colors[type] || 'light';
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Product Management</h2>
          <div className="d-flex gap-3 mt-2">
            <Badge color="info" pill className="p-2">Total: {summary.total || 0}</Badge>
            <Badge color="success" pill className="p-2">Active: {summary.active || 0}</Badge>
            <Badge color="warning" pill className="p-2">Low Stock: {summary.lowStock || 0}</Badge>
          </div>
        </div>
        <div>
          <Button color="info" onClick={openAnalyticsModal} className="mr-2">
            📊 Analytics
          </Button>
          <Button color="success" tag={Link} to="/seller/add-product">
            ➕ Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardBody>
          <Row>
            <Col md="4">
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
            <Col md="2">
              <Input
                type="select"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Input>
            </Col>
            <Col md="2">
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
              <Input
                type="select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="createdAt">Date Created</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
                <option value="totalSold">Total Sold</option>
                <option value="revenue">Revenue</option>
              </Input>
            </Col>
            <Col md="2">
              <ButtonGroup>
                <Button 
                  color={sortOrder === 'desc' ? 'primary' : 'outline-primary'}
                  onClick={() => {
                    setSortOrder('desc');
                    setCurrentPage(1);
                  }}
                  size="sm"
                >
                  ⬇ Desc
                </Button>
                <Button 
                  color={sortOrder === 'asc' ? 'primary' : 'outline-primary'}
                  onClick={() => {
                    setSortOrder('asc');
                    setCurrentPage(1);
                  }}
                  size="sm"
                >
                  ⬆ Asc
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Products Table */}
      <Card>
        <CardBody>
          {filteredProducts.length > 0 ? (
            <>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product Details</th>
                    <th>Pricing</th>
                    <th>Stock</th>
                    <th>Performance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>
                        {product.images && product.images.length > 0 ? (
                          <SecureImage
                            mediaId={product.images.find(img => img.isPrimary)?.media_id || product.images[0]?.media_id}
                            alt={product.name}
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            className="rounded"
                            isThumb={true}
                          />
                        ) : (
                          <div className="bg-light rounded d-flex align-items-center justify-content-center" 
                               style={{ width: '60px', height: '60px' }}>
                            📦
                          </div>
                        )}
                      </td>
                      <td>
                        <div>
                          <strong>{product.name}</strong>
                          <br />
                          <Badge color="secondary" className="mr-1">{product.category}</Badge>
                          <br />
                          <small className="text-muted">ID: {product.id?.slice(-8)}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>${product.price}</strong>
                          <br />
                          <small className="text-success">Revenue: {getRevenueDisplay(product.revenue)}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          {getStockBadge(product.stock, product.lowStockAlert)}
                          <br />
                          <small className="text-muted">Alert: {product.lowStockAlert}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <Badge color="info">Sold: {product.totalSold || 0}</Badge>
                          <br />
                          <small className="text-muted">
                            Created: {formatDate(product.createdAt)}
                          </small>
                        </div>
                      </td>
                      <td>
                        {product.isActive ? (
                          <Badge color="success">Active</Badge>
                        ) : (
                          <Badge color="danger">Inactive</Badge>
                        )}
                      </td>
                      <td>
                        <Dropdown 
                          isOpen={actionsDropdown[product.id] || false} 
                          toggle={() => toggleActionsDropdown(product.id)}
                        >
                          <DropdownToggle caret color="primary" size="sm">
                            Actions
                          </DropdownToggle>
                          <DropdownMenu>
                            <DropdownItem tag={Link} to={`/seller/edit-product/${product.id}`}>
                              ✏️ Edit Product
                            </DropdownItem>
                            <DropdownItem onClick={() => openStockModal(product)}>
                              📦 Manage Stock
                            </DropdownItem>
                            <DropdownItem onClick={() => openHistoryModal(product)}>
                              📊 View History
                            </DropdownItem>
                            <DropdownItem divider />
                            <DropdownItem 
                              onClick={() => handleDelete(product.id)} 
                              className="text-danger"
                              disabled={deletingProducts.has(product.id)}
                            >
                              {deletingProducts.has(product.id) ? '⏳ Deleting...' : '🗑️ Delete Product'}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                  </div>
                  <ButtonGroup>
                    <Button 
                      disabled={pagination.page === 1} 
                      onClick={() => setCurrentPage(pagination.page - 1)}
                      size="sm"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: pagination.pages }, (_, i) => (
                      <Button
                        key={i + 1}
                        color={pagination.page === i + 1 ? 'primary' : 'outline-primary'}
                        onClick={() => setCurrentPage(i + 1)}
                        size="sm"
                      >
                        {i + 1}
                      </Button>
                    )).slice(Math.max(0, pagination.page - 3), pagination.page + 2)}
                    <Button 
                      disabled={pagination.page === pagination.pages} 
                      onClick={() => setCurrentPage(pagination.page + 1)}
                      size="sm"
                    >
                      Next
                    </Button>
                  </ButtonGroup>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <h5 className="text-muted">No products found</h5>
              <p className="text-muted">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Start by adding your first product'
                }
              </p>
              <Button color="success" tag={Link} to="/seller/add-product">
                Add Product
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Stock Management Modal */}
      <Modal isOpen={stockModal} toggle={() => setStockModal(false)}>
        <ModalHeader toggle={() => setStockModal(false)}>
          Manage Stock - {selectedProduct?.name}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="currentStock">Current Stock</Label>
              <Input
                type="text"
                id="currentStock"
                value={selectedProduct?.stock || 0}
                disabled
                className="mb-2"
              />
              <small className="text-muted">Low stock alert: {selectedProduct?.lowStockAlert || 5}</small>
            </FormGroup>
            <FormGroup>
              <Label for="newStock">New Stock Quantity</Label>
              <Input
                type="number"
                id="newStock"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                min="0"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="stockNotes">Notes (Optional)</Label>
              <Input
                type="textarea"
                id="stockNotes"
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                placeholder="Reason for stock change..."
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleUpdateStock}>
            Update Stock
          </Button>
          <Button color="secondary" onClick={() => setStockModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Product History Modal */}
      <Modal isOpen={historyModal} toggle={() => setHistoryModal(false)} size="lg">
        <ModalHeader toggle={() => setHistoryModal(false)}>
          Product History - {selectedProduct?.name}
        </ModalHeader>
        <ModalBody>
          <Nav tabs>
            <NavItem>
              <NavLink
                className={activeTab === 'all' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('all');
                  if (selectedProduct) fetchProductHistory(selectedProduct.id, 'all');
                }}
                style={{ cursor: 'pointer' }}
              >
                All Activity
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === 'sale' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('sale');
                  if (selectedProduct) fetchProductHistory(selectedProduct.id, 'sale');
                }}
                style={{ cursor: 'pointer' }}
              >
                Sales
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === 'stock_add' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('stock_add');
                  if (selectedProduct) fetchProductHistory(selectedProduct.id, 'stock_add');
                }}
                style={{ cursor: 'pointer' }}
              >
                Stock Changes
              </NavLink>
            </NavItem>
          </Nav>
          
          <TabContent activeTab={activeTab} className="mt-3">
            <TabPane tabId={activeTab}>
              {historyLoading ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : productHistory.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {productHistory.map((entry, index) => (
                    <Card key={index} className="mb-2">
                      <CardBody className="p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="d-flex align-items-center">
                            <Badge color={getHistoryTypeColor(entry.type)} className="mr-2">
                              {getHistoryTypeIcon(entry.type)} {entry.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <div>
                              {entry.type === 'sale' && (
                                <div>
                                  <strong>Sale: {entry.quantity} units</strong>
                                  {entry.metadata?.unitPrice && (
                                    <small className="text-muted d-block">
                                      Unit Price: ${entry.metadata.unitPrice} | 
                                      Total: ${entry.metadata.totalPrice}
                                    </small>
                                  )}
                                  {entry.orderId && (
                                    <small className="text-muted d-block">Order: {entry.orderId}</small>
                                  )}
                                </div>
                              )}
                              {(entry.type === 'stock_add' || entry.type === 'stock_reduce') && (
                                <div>
                                  <strong>Stock {entry.type === 'stock_add' ? 'Added' : 'Reduced'}: {entry.quantity} units</strong>
                                  <small className="text-muted d-block">
                                    {entry.previousStock} → {entry.newStock}
                                  </small>
                                </div>
                              )}
                              {entry.notes && (
                                <small className="text-info d-block">Note: {entry.notes}</small>
                              )}
                            </div>
                          </div>
                          <small className="text-muted">{formatDate(entry.createdAt)}</small>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert color="info">No history found for this product.</Alert>
              )}
            </TabPane>
          </TabContent>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setHistoryModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Analytics Modal */}
      <Modal isOpen={analyticsModal} toggle={() => setAnalyticsModal(false)} size="lg">
        <ModalHeader toggle={() => setAnalyticsModal(false)}>
          Product Analytics (Last 30 Days)
        </ModalHeader>
        <ModalBody>
          {analyticsLoading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : analytics ? (
            <div>
              {/* Summary Cards */}
              <Row className="mb-4">
                <Col md="3">
                  <Card className="text-center">
                    <CardBody>
                      <h4 className="text-primary">{analytics.summary.totalProducts}</h4>
                      <small>Total Products</small>
                    </CardBody>
                  </Card>
                </Col>
                <Col md="3">
                  <Card className="text-center">
                    <CardBody>
                      <h4 className="text-success">{analytics.summary.totalSold}</h4>
                      <small>Units Sold</small>
                    </CardBody>
                  </Card>
                </Col>
                <Col md="3">
                  <Card className="text-center">
                    <CardBody>
                      <h4 className="text-info">{getRevenueDisplay(analytics.summary.totalRevenue)}</h4>
                      <small>Total Revenue</small>
                    </CardBody>
                  </Card>
                </Col>
                <Col md="3">
                  <Card className="text-center">
                    <CardBody>
                      <h4 className="text-warning">{analytics.summary.lowStockProducts}</h4>
                      <small>Low Stock Items</small>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Recent Sales */}
              <h5>Recent Sales</h5>
              {analytics.recentSales.length > 0 ? (
                <Table size="sm" className="mb-4">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Quantity</th>
                      <th>Revenue</th>
                      <th>Order ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentSales.slice(0, 10).map((sale, index) => (
                      <tr key={index}>
                        <td>{formatDate(sale.createdAt)}</td>
                        <td>{sale.quantity}</td>
                        <td>${sale.metadata?.totalPrice}</td>
                        <td><small>{sale.orderId}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert color="info">No recent sales in the last 30 days.</Alert>
              )}

              {/* Sales by Category */}
              <h5>Sales by Category</h5>
              {analytics.salesByCategory.length > 0 ? (
                <div>
                  {analytics.salesByCategory.map((category, index) => (
                    <div key={index} className="mb-3">
                      <div className="d-flex justify-content-between">
                        <span>{category.id}</span>
                        <span>{category.totalSales} units | {getRevenueDisplay(category.totalRevenue)}</span>
                      </div>
                      <Progress 
                        value={(category.totalSales / Math.max(...analytics.salesByCategory.map(c => c.totalSales))) * 100} 
                        color="info" 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Alert color="info">No category sales data available.</Alert>
              )}
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setAnalyticsModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ProductsList;