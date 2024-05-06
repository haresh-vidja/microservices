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

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined
      };

      const response = await axios.get('/api/admin/proxy/orders/api/v1/admin/orders', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Service-Key': 'admin-secret-key-2024'
        },
        params
      });

      if (response.data.success) {
        setOrders(response.data.data.orders || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`/api/admin/proxy/orders/api/v1/orders/${orderId}/status`, {
        status: newStatus
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Service-Key': 'admin-secret-key-2024'
        }
      });

      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
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
      pending: { color: 'warning', text: 'Pending' },
      confirmed: { color: 'info', text: 'Confirmed' },
      processing: { color: 'primary', text: 'Processing' },
      shipped: { color: 'success', text: 'Shipped' },
      delivered: { color: 'success', text: 'Delivered' },
      cancelled: { color: 'danger', text: 'Cancelled' },
      refunded: { color: 'secondary', text: 'Refunded' }
    };
    
    const statusInfo = statusMap[status] || { color: 'secondary', text: status };
    return <Badge color={statusInfo.color}>{statusInfo.text}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Order Management</h1>
          <p className="text-muted">Monitor and manage all orders</p>
        </div>
        <Button color="primary" onClick={fetchOrders}>
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
                  placeholder="Search by order number, customer, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button color="primary" onClick={fetchOrders}>
                  <i className="fas fa-search"></i>
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
                  color={filterStatus === 'pending' ? 'warning' : 'outline-warning'}
                  onClick={() => setFilterStatus('pending')}
                  size="sm"
                >
                  Pending
                </Button>
                <Button
                  color={filterStatus === 'processing' ? 'info' : 'outline-info'}
                  onClick={() => setFilterStatus('processing')}
                  size="sm"
                >
                  Processing
                </Button>
                <Button
                  color={filterStatus === 'delivered' ? 'success' : 'outline-success'}
                  onClick={() => setFilterStatus('delivered')}
                  size="sm"
                >
                  Delivered
                </Button>
              </ButtonGroup>
            </Col>
            <Col md="2" className="text-right">
              <span className="text-muted">
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </span>
            </Col>
          </Row>

          {/* Orders Table */}
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
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="font-weight-medium">
                          #{order.orderNumber || order.id.slice(-8)}
                        </div>
                      </td>
                      <td>
                        <div>{order.customerInfo?.name || `Customer ${order.customerId}`}</div>
                        <small className="text-muted">{order.customerInfo?.email}</small>
                      </td>
                      <td>
                        <div className="font-weight-bold">{formatPrice(order.totalAmount)}</div>
                      </td>
                      <td>
                        <Badge color="secondary">
                          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                        </Badge>
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button 
                            color="info" 
                            onClick={() => handleViewDetails(order)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          {order.status === 'pending' && (
                            <Button 
                              color="success"
                              onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                              title="Confirm Order"
                            >
                              <i className="fas fa-check"></i>
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button 
                              color="primary"
                              onClick={() => handleStatusUpdate(order.id, 'processing')}
                              title="Start Processing"
                            >
                              <i className="fas fa-cog"></i>
                            </Button>
                          )}
                          {order.status === 'processing' && (
                            <Button 
                              color="info"
                              onClick={() => handleStatusUpdate(order.id, 'shipped')}
                              title="Mark as Shipped"
                            >
                              <i className="fas fa-shipping-fast"></i>
                            </Button>
                          )}
                          {['pending', 'confirmed'].includes(order.status) && (
                            <Button 
                              color="danger"
                              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                              title="Cancel Order"
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          )}
                        </ButtonGroup>
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

      {/* Order Details Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setModalOpen(false)}>
          Order Details
        </ModalHeader>
        <ModalBody>
          {selectedOrder && (
            <Row>
              <Col md="6">
                <h6>Order Information</h6>
                <p><strong>Order Number:</strong> #{selectedOrder.orderNumber || selectedOrder.id.slice(-8)}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                <p><strong>Total Amount:</strong> {formatPrice(selectedOrder.totalAmount)}</p>
                <p><strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
              </Col>
              <Col md="6">
                <h6>Customer Information</h6>
                <p><strong>Customer ID:</strong> {selectedOrder.customerId}</p>
                <p><strong>Name:</strong> {selectedOrder.customerInfo?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedOrder.customerInfo?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedOrder.customerInfo?.phone || 'N/A'}</p>
              </Col>
              {selectedOrder.shippingAddress && (
                <Col md="12">
                  <h6>Shipping Address</h6>
                  <p>
                    {selectedOrder.shippingAddress.addressLine1}<br/>
                    {selectedOrder.shippingAddress.addressLine2 && (
                      <>{selectedOrder.shippingAddress.addressLine2}<br/></>
                    )}
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}<br/>
                    {selectedOrder.shippingAddress.country}
                  </p>
                </Col>
              )}
              <Col md="12">
                <h6>Order Items</h6>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <Table size="sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName || item.productId}</td>
                          <td>{formatPrice(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p>No items found</p>
                )}
              </Col>
              <Col md="12">
                <h6>Order History</h6>
                <p><strong>Created:</strong> {formatDate(selectedOrder.createdAt)}</p>
                <p><strong>Last Updated:</strong> {formatDate(selectedOrder.updatedAt)}</p>
                <p><strong>Order ID:</strong> {selectedOrder.id}</p>
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

export default AdminOrders;