import React from 'react';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink, NavbarToggler, Collapse, Badge } from 'reactstrap';
import { Link, useHistory } from 'react-router-dom';
import cartService from '../../services/cartService';

const Header = () => {
  const history = useHistory();
  const [isOpen, setIsOpen] = React.useState(false);
  const [customerToken, setCustomerToken] = React.useState(null);
  const [sellerToken, setSellerToken] = React.useState(null);
  const [adminToken, setAdminToken] = React.useState(null);
  const [cartCount, setCartCount] = React.useState(0);
  const [customerData, setCustomerData] = React.useState({});
  const [adminData, setAdminData] = React.useState({});
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  React.useEffect(() => {
    // Initialize data from localStorage
    setCustomerToken(localStorage.getItem('customerToken'));
    setSellerToken(localStorage.getItem('sellerToken'));
    setAdminToken(localStorage.getItem('adminToken'));
    setCustomerData(JSON.parse(localStorage.getItem('customerData') || '{}'));
    setAdminData(JSON.parse(localStorage.getItem('adminInfo') || '{}'));
    setIsLoaded(true);
    
    // Load cart count
    loadCartCount();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCartCount();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);
  
  const loadCartCount = async () => {
    try {
      const count = await cartService.getCartCount();
      setCartCount(count);
    } catch (error) {
      console.error('Failed to load cart count:', error);
    }
  };
  
  const toggle = () => setIsOpen(!isOpen);
  
  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('customerToken');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('customerData');
    localStorage.removeItem('sellerData');
    localStorage.removeItem('adminInfo');
    
    // Clear cart data
    cartService.clearAllCartData();
    
    // Update state immediately
    setCustomerToken(null);
    setSellerToken(null);
    setAdminToken(null);
    setCustomerData({});
    setAdminData({});
    setCartCount(0);
    
    history.push('/');
  };
  
  // Don't render until data is loaded to prevent flickering
  if (!isLoaded) {
    return (
      <Navbar color="dark" dark expand="md" className="mb-4">
        <NavbarBrand tag={Link} to="/">E-Commerce</NavbarBrand>
      </Navbar>
    );
  }

  return (
    <Navbar color="dark" dark expand="md" className="mb-4">
      <NavbarBrand tag={Link} to="/">E-Commerce</NavbarBrand>
      <NavbarToggler onClick={toggle} />
      <Collapse isOpen={isOpen} navbar>
        <Nav className="mr-auto" navbar>
          <NavItem>
            <NavLink tag={Link} to="/products">Products</NavLink>
          </NavItem>
          {!sellerToken && !adminToken && (
            <NavItem>
              <NavLink tag={Link} to="/cart" className="d-flex align-items-center">
                <i className="fas fa-shopping-cart mr-1"></i>
                Cart
                {cartCount > 0 && (
                  <Badge color="danger" pill className="ml-1" style={{ fontSize: '0.7em' }}>
                    {cartCount}
                  </Badge>
                )}
              </NavLink>
            </NavItem>
          )}
        </Nav>
        <Nav navbar>
          {!customerToken && !sellerToken && !adminToken ? (
            <>
              <NavItem>
                <NavLink tag={Link} to="/customer/login">Customer Login</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} to="/seller/login">Seller Login</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} to="/admin/login">Admin Login</NavLink>
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
                <>
                  <NavItem>
                    <NavLink tag={Link} to="/seller/dashboard">Dashboard</NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink tag={Link} to="/seller/profile">Profile</NavLink>
                  </NavItem>
                </>
              )}
              {adminToken && adminData && (
                <>
                  <NavItem>
                    <NavLink className="d-flex align-items-center">
                      <i className="fas fa-shield-alt mr-1"></i>
                      Admin: {adminData.firstName || adminData.email || 'Administrator'}
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink tag={Link} to="/admin/dashboard">Admin Panel</NavLink>
                  </NavItem>
                </>
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