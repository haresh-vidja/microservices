import React from 'react';
import {
  Navbar,
  NavbarBrand,
  Nav,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button
} from 'reactstrap';
import { useHistory } from 'react-router-dom';

const SellerNavbar = ({ toggleSidebar }) => {
  const history = useHistory();
  const sellerInfo = JSON.parse(localStorage.getItem('sellerInfo') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerInfo');
    history.push('/seller/login');
  };

  return (
    <Navbar color="white" light expand className="seller-navbar border-bottom">
      <Button 
        color="link" 
        className="sidebar-toggle mr-3"
        onClick={toggleSidebar}
      >
        <span className="navbar-toggler-icon"></span>
      </Button>
      
      <NavbarBrand href="/seller/dashboard" className="font-weight-bold">
        Seller Portal
      </NavbarBrand>

      <Nav className="ml-auto" navbar>
        <UncontrolledDropdown nav inNavbar>
          <DropdownToggle nav caret>
            <span className="badge badge-secondary rounded-circle p-2 mr-2">
              {sellerInfo.name ? sellerInfo.name.charAt(0).toUpperCase() : 'S'}
            </span>
            <span className="d-none d-md-inline">{sellerInfo.name || 'Seller'}</span>
          </DropdownToggle>
          <DropdownMenu right>
            <DropdownItem header>{sellerInfo.email}</DropdownItem>
            <DropdownItem divider />
            <DropdownItem onClick={() => history.push('/seller/profile')}>
              <i className="bi bi-person mr-2"></i> Profile
            </DropdownItem>
            <DropdownItem divider />
            <DropdownItem onClick={handleLogout} className="text-danger">
              <i className="bi bi-box-arrow-right mr-2"></i> Logout
            </DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
      </Nav>
    </Navbar>
  );
};

export default SellerNavbar;