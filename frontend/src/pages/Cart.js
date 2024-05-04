import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, Table, Button, Input, Badge, Alert } from 'reactstrap';
import { useHistory, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import cartService from '../services/cartService';

const Cart = () => {
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const history = useHistory();

  useEffect(() => {
    loadCart();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartService.initializeCart();
      setCart(cartData);
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setUpdating(true);
      await cartService.updateQuantity(productId, newQuantity);
      await loadCart();
    } catch (error) {
      console.error('Update quantity error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setUpdating(true);
      await cartService.removeFromCart(productId);
      await loadCart();
    } catch (error) {
      console.error('Remove from cart error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    try {
      setUpdating(true);
      await cartService.clearCart();
      await loadCart();
    } catch (error) {
      console.error('Clear cart error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const calculateSubtotal = () => {
    return cart.totalAmount || 0;
  };
  
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.1;
    return (subtotal + tax).toFixed(2);
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    const customerToken = localStorage.getItem('customerToken');
    if (!customerToken) {
      toast.error('Please login to checkout');
      history.push('/customer/login');
      return;
    }
    
    setLoading(true);
    
    // TODO: Implement actual checkout with order placement
    setTimeout(async () => {
      toast.success('Order placed successfully!');
      await clearCart();
      setLoading(false);
      history.push('/customer/profile');
    }, 2000);
  };

  if (loading) {
    return (
      <Container className="py-5">
        <Row>
          <Col className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2">Loading cart...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <Container className="py-5">
        <Row>
          <Col className="text-center">
            <h3>Your Cart is Empty</h3>
            <p className="lead">Start shopping to add items to your cart.</p>
            <Button color="primary" tag={Link} to="/products">
              Browse Products
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Shopping Cart</h2>
            <Badge color="info" pill>
              {cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''}
            </Badge>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg="8">
          <Card>
            <CardBody>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map(item => (
                    <tr key={item.productId || item._id || item.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.productImage && (
                            <img 
                              src={item.productImage} 
                              alt={item.productName}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px' }}
                            />
                          )}
                          <div>
                            <strong>{item.productName || item.name}</strong>
                            <br />
                            <small className="text-muted">
                              Product ID: {item.productId || item._id}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>${item.price}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Button 
                            size="sm" 
                            outline
                            onClick={() => updateQuantity(item.productId || item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updating}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId || item._id, parseInt(e.target.value) || 1)}
                            style={{ width: '60px', margin: '0 5px', textAlign: 'center' }}
                            min="1"
                          />
                          <Button 
                            size="sm" 
                            outline
                            onClick={() => updateQuantity(item.productId || item._id, item.quantity + 1)}
                            disabled={updating}
                          >
                            +
                          </Button>
                        </div>
                      </td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                      <td>
                        <Button 
                          color="danger" 
                          size="sm"
                          onClick={() => removeFromCart(item.productId || item._id)}
                          disabled={updating}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="mt-3">
                <Button color="warning" outline onClick={clearCart} disabled={updating}>
                  {updating ? 'Updating...' : 'Clear Cart'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg="4">
          <Card>
            <CardBody>
              <h5>Order Summary</h5>
              <hr />
              
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Tax:</span>
                <span>${(calculateSubtotal() * 0.1).toFixed(2)}</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-4">
                <strong>Total:</strong>
                <strong>${calculateTotal()}</strong>
              </div>

              <Alert color="info" className="small">
                Note: This is a demo checkout. No actual payment will be processed.
              </Alert>
              
              <Button 
                color="success" 
                size="lg" 
                block
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Checkout'}
              </Button>
              
              <Button 
                color="secondary" 
                outline 
                block 
                className="mt-2"
                tag={Link}
                to="/products"
              >
                Continue Shopping
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;