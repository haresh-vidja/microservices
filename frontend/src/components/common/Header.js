import React from 'react';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink, NavbarToggler, Collapse, Badge } from 'reactstrap';
import { Link, useHistory } from 'react-router-dom';

const Header = () => {
  const history = useHistory();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const customerToken = localStorage.getItem('customerToken');
  const sellerToken = localStorage.getItem('sellerToken');
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const customerData = JSON.parse(localStorage.getItem('customerData') || '{}');
  
  const toggle = () => setIsOpen(!isOpen);
  
  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('customerData');
    localStorage.removeItem('sellerData');
    history.push('/');
  };
  
  return (
    <Navbar color="dark" dark expand="md" className="mb-4">
      <NavbarBrand tag={Link} to="/">E-Commerce</NavbarBrand>
      <NavbarToggler onClick={toggle} />
      <Collapse isOpen={isOpen} navbar>
        <Nav className="mr-auto" navbar>
          <NavItem>
            <NavLink tag={Link} to="/products">Products</NavLink>
          </NavItem>
          <NavItem>
            <NavLink tag={Link} to="/cart" className="d-flex align-items-center">
              <i className="fas fa-shopping-cart mr-1"></i>
              Cart
              {cartItems.length > 0 && (
                <Badge color="danger" pill className="ml-1" style={{ fontSize: '0.7em' }}>
                  {cartItems.length}
                </Badge>
              )}
            </NavLink>
          </NavItem>
        </Nav>
        <Nav navbar>
          {!customerToken && !sellerToken ? (
            <>
              <NavItem>
                <NavLink tag={Link} to="/customer/login">Customer Login</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} to="/seller/login">Seller Login</NavLink>
              </NavItem>
            </>
          ) : (
            <>
              {customerToken && customerData && (
                <>
                  <NavItem>
                    <NavLink className="d-flex align-items-center">
                      <i className="fas fa-user mr-1"></i>
                      Welcome, {customerData.firstName || customerData.email || 'Customer'}
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink tag={Link} to="/customer/profile">My Profile</NavLink>
                  </NavItem>
                </>
              )}
              {sellerToken && (
                <NavItem>
                  <NavLink tag={Link} to="/seller/dashboard">Dashboard</NavLink>
                </NavItem>
              )}
              {!customerToken && (
                <NavItem>
                  <NavLink tag={Link} to="/customer/login">Customer Login</NavLink>
                </NavItem>
              )}
              {!sellerToken && (
                <NavItem>
                  <NavLink tag={Link} to="/seller/login">Seller Login</NavLink>
                </NavItem>
              )}
              <NavItem>
                <NavLink onClick={handleLogout} style={{ cursor: 'pointer' }}>
                  <i className="fas fa-sign-out-alt mr-1"></i>
                  Logout
                </NavLink>
              </NavItem>
            </>
          )}
        </Nav>
      </Collapse>
    </Navbar>
  );
};

export default Header;