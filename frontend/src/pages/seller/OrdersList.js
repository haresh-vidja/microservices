import React, { useState, useEffect } from 'react';
import { Table, Button, Card, CardBody, Badge, Row, Col, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerId = JSON.parse(localStorage.getItem('sellerInfo') || '{}').id;
      
      const response = await axios.get(`/api/orders?sellerId=${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('sellerToken');
      await axios.patch(`/api/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'primary',
      shipped: 'secondary',
      delivered: 'success',
      cancelled: 'danger'
    };
    return <Badge color={statusColors[status] || 'light'}>{status.toUpperCase()}</Badge>;
  };

  const toggleModal = () => setModalOpen(!modalOpen);

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    toggleModal();
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
      <h2 className="mb-4">Orders Management</h2>

      <Row className="mb-4">
        <Col md="3">
          <Card className="text-center">
            <CardBody>
              <h4>{orders.filter(o => o.status === 'pending').length}</h4>
              <p className="text-muted mb-0">Pending Orders</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card className="text-center">
            <CardBody>
              <h4>{orders.filter(o => o.status === 'processing').length}</h4>
              <p className="text-muted mb-0">Processing</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card className="text-center">
            <CardBody>
              <h4>{orders.filter(o => o.status === 'shipped').length}</h4>
              <p className="text-muted mb-0">Shipped</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card className="text-center">
            <CardBody>
              <h4>{orders.filter(o => o.status === 'delivered').length}</h4>
              <p className="text-muted mb-0">Delivered</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card>
        <CardBody>
          {orders.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td>
                      <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                    </td>
                    <td>{order.customerName || 'N/A'}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td>${order.totalAmount?.toFixed(2) || '0.00'}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <Button
                        color="info"
                        size="sm"
                        className="mr-2"
                        onClick={() => viewOrderDetails(order)}
                      >
                        View
                      </Button>
                      {order.status === 'pending' && (
                        <Button
                          color="success"
                          size="sm"
                          onClick={() => updateOrderStatus(order._id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button
                          color="primary"
                          size="sm"
                          onClick={() => updateOrderStatus(order._id, 'processing')}
                        >
                          Process
                        </Button>
                      )}
                      {order.status === 'processing' && (
                        <Button
                          color="secondary"
                          size="sm"
                          onClick={() => updateOrderStatus(order._id, 'shipped')}
                        >
                          Ship
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <h5 className="text-muted">No orders yet</h5>
              <p className="text-muted">Orders will appear here when customers purchase your products</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} toggle={toggleModal} size="lg">
        <ModalHeader toggle={toggleModal}>
          Order Details #{selectedOrder?._id.slice(-8).toUpperCase()}
        </ModalHeader>
        <ModalBody>
          {selectedOrder && (
            <div>
              <Row>
                <Col md="6">
                  <h6>Customer Information</h6>
                  <p>
                    <strong>Name:</strong> {selectedOrder.customerName || 'N/A'}<br />
                    <strong>Email:</strong> {selectedOrder.customerEmail || 'N/A'}<br />
                    <strong>Phone:</strong> {selectedOrder.customerPhone || 'N/A'}
                  </p>
                </Col>
                <Col md="6">
                  <h6>Order Information</h6>
                  <p>
                    <strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}<br />
                    <strong>Status:</strong> {getStatusBadge(selectedOrder.status)}<br />
                    <strong>Total:</strong> ${selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                  </p>
                </Col>
              </Row>
              
              <h6 className="mt-3">Shipping Address</h6>
              <p>{selectedOrder.shippingAddress || 'No shipping address provided'}</p>

              <h6 className="mt-3">Order Items</h6>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price?.toFixed(2)}</td>
                      <td>${(item.quantity * item.price)?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleModal}>Close</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default OrdersList;