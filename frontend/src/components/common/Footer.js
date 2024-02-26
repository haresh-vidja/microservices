import React from 'react';
import { Container, Row, Col } from 'reactstrap';

const Footer = () => {
  return (
    <footer className="footer bg-dark text-light">
      <Container>
        <Row>
          <Col md="4">
            <h5>E-Commerce Platform</h5>
            <p>Your one-stop shop for all your needs</p>
          </Col>
          <Col md="4">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li><a href="/products" className="text-light">Products</a></li>
              <li><a href="/customer/login" className="text-light">Customer Login</a></li>
              <li><a href="/seller/login" className="text-light">Seller Login</a></li>
            </ul>
          </Col>
          <Col md="4">
            <h5>Contact</h5>
            <p>Email: info@ecommerce.com</p>
            <p>Phone: +1 234 567 8900</p>
          </Col>
        </Row>
        <hr className="bg-light" />
        <Row>
          <Col className="text-center">
            <p>&copy; 2024 E-Commerce Platform. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;