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

const AdminNavbar = ({ toggleSidebar }) => {
  const history = useHistory();
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    history.push('/admin/login');
  };

  return (
    <Navbar color="dark" dark expand className="admin-navbar">
      <Button 
        color="link" 
        className="sidebar-toggle mr-3 text-white"
        onClick={toggleSidebar}
      >
        <i className="fas fa-bars"></i>
      </Button>
      
      <NavbarBrand href="/admin/dashboard" className="font-weight-bold">
        <i className="fas fa-shield-alt mr-2"></i>
        Admin Portal
      </NavbarBrand>

      <Nav className="ml-auto" navbar>
        <UncontrolledDropdown nav inNavbar>
          <DropdownToggle nav caret className="text-white">
            <span className="badge badge-light rounded-circle p-2 mr-2">
              {adminInfo.firstName ? adminInfo.firstName.charAt(0).toUpperCase() : 'A'}
            </span>
            <span className="d-none d-md-inline">
              {adminInfo.firstName ? `${adminInfo.firstName} ${adminInfo.lastName}` : 'Admin'}
            </span>
          </DropdownToggle>
          <DropdownMenu right>
            <DropdownItem header>
              {adminInfo.email}
              {adminInfo.role && (
                <small className="d-block text-muted">{adminInfo.role.replace('_', ' ').toUpperCase()}</small>
              )}
            </DropdownItem>
            <DropdownItem divider />
            <DropdownItem onClick={() => history.push('/admin/profile')}>
              <i className="fas fa-user mr-2"></i> Profile
            </DropdownItem>
            <DropdownItem onClick={() => history.push('/admin/settings')}>
              <i className="fas fa-cog mr-2"></i> Settings
            </DropdownItem>
            <DropdownItem divider />
            <DropdownItem onClick={handleLogout} className="text-danger">
              <i className="fas fa-sign-out-alt mr-2"></i> Logout
            </DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
      </Nav>
    </Navbar>
  );
};

export default AdminNavbar;