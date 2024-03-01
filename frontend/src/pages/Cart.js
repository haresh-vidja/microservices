import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, Table, Button, Input, Badge, Alert } from 'reactstrap';
import { useHistory, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      history.push('/customer/login');
      return;
    }
    loadCartItems();
  }, [history]);

  const loadCartItems = () => {
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(items);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = cartItems.map(item => 
      item._id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    setCartItems(updatedItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    toast.success('Quantity updated');
  };

  const removeFromCart = (productId) => {
    const updatedItems = cartItems.filter(item => item._id !== productId);
    setCartItems(updatedItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
    toast.success('Cart cleared');
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    setLoading(true);
    
    setTimeout(() => {
      toast.success('Order placed successfully!');
      clearCart();
      setLoading(false);
      history.push('/customer/profile');
    }, 2000);
  };

  if (cartItems.length === 0) {
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
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
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
                  {cartItems.map(item => (
                    <tr key={item._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.images && item.images[0] && (
                            <img 
                              src={item.images[0]} 
                              alt={item.name}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px' }}
                            />
                          )}
                          <div>
                            <strong>{item.name}</strong>
                            <br />
                            <small className="text-muted">
                              {item.description?.substring(0, 50)}...
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
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                            style={{ width: '60px', margin: '0 5px', textAlign: 'center' }}
                            min="1"
                          />
                          <Button 
                            size="sm" 
                            outline
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
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
                          onClick={() => removeFromCart(item._id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="mt-3">
                <Button color="warning" outline onClick={clearCart}>
                  Clear Cart
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
                <span>${calculateTotal()}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Tax:</span>
                <span>${(parseFloat(calculateTotal()) * 0.1).toFixed(2)}</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-4">
                <strong>Total:</strong>
                <strong>${(parseFloat(calculateTotal()) * 1.1).toFixed(2)}</strong>
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