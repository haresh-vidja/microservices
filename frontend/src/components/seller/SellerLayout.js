import React, { useState } from 'react';
import { Container, Row, Col } from 'reactstrap';
import SellerNavbar from './SellerNavbar';
import SellerSidebar from './SellerSidebar';
import './SellerLayout.css';

function SellerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="seller-layout">
      <SellerNavbar toggleSidebar={toggleSidebar} />
      <Container fluid className="p-0">
        <Row className="no-gutters">
          <Col 
            md={sidebarOpen ? "2" : "1"} 
            lg={sidebarOpen ? "2" : "1"} 
            className="sidebar-wrapper"
          >
            <SellerSidebar isOpen={sidebarOpen} />
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

export default SellerLayout;