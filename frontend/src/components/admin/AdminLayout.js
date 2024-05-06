import React, { useState } from 'react';
import { Container, Row, Col } from 'reactstrap';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="admin-layout">
      <AdminNavbar toggleSidebar={toggleSidebar} />
      <Container fluid className="p-0">
        <Row className="no-gutters">
          <Col 
            md={sidebarOpen ? "2" : "1"} 
            lg={sidebarOpen ? "2" : "1"} 
            className="sidebar-wrapper"
          >
            <AdminSidebar isOpen={sidebarOpen} />
          </Col>
          <Col 
            md={sidebarOpen ? "10" : "11"} 
            lg={sidebarOpen ? "10" : "11"} 
            className="main-content-wrapper"
          >
            <Container fluid className="p-4">
              {children}
            </Container>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default AdminLayout;