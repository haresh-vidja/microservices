import React from 'react';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink, NavbarToggler, Collapse, Badge } from 'reactstrap';
import { Link, useHistory } from 'react-router-dom';

const Header = () => {
  const history = useHistory();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const customerToken = localStorage.getItem('customerToken');
  const sellerToken = localStorage.getItem('sellerToken');
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  
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
          {customerToken && (
            <NavItem>
              <NavLink tag={Link} to="/cart">
                Cart
                {cartItems.length > 0 && (
                  <Badge color="danger" pill className="cart-badge">
                    {cartItems.length}
                  </Badge>
                )}
              </NavLink>
            </NavItem>
          )}
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
              {customerToken && (
                <NavItem>
                  <NavLink tag={Link} to="/customer/profile">Profile</NavLink>
                </NavItem>
              )}
              {sellerToken && (
                <NavItem>
                  <NavLink tag={Link} to="/seller/dashboard">Dashboard</NavLink>
                </NavItem>
              )}
              <NavItem>
                <NavLink onClick={handleLogout} style={{ cursor: 'pointer' }}>
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