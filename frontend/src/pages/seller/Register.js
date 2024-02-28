import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const SellerRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    businessType: 'individual'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await axios.post('/api/sellers/auth/register', submitData);
      
      if (response.data.success) {
        toast.success('Registration successful! Please login.');
        history.push('/seller/login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md="8">
          <Card>
            <CardBody>
              <h2 className="text-center mb-4">Seller Registration</h2>
              {error && <Alert color="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="firstName">First Name</Label>
                      <Input
                        type="text"
                        name="firstName"
                        id="firstName"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="lastName">Last Name</Label>
                      <Input
                        type="text"
                        name="lastName"
                        id="lastName"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                </Row>
                
                <FormGroup>
                  <Label for="email">Email</Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="password">Password</Label>
                      <Input
                        type="password"
                        name="password"
                        id="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="confirmPassword">Confirm Password</Label>
                      <Input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                </Row>
                
                <FormGroup>
                  <Label for="phone">Phone</Label>
                  <Input
                    type="tel"
                    name="phone"
                    id="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label for="businessName">Business Name</Label>
                  <Input
                    type="text"
                    name="businessName"
                    id="businessName"
                    placeholder="Enter your business name"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label for="businessAddress">Business Address</Label>
                  <Input
                    type="textarea"
                    name="businessAddress"
                    id="businessAddress"
                    placeholder="Enter your business address"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label for="businessType">Business Type</Label>
                  <Input
                    type="select"
                    name="businessType"
                    id="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="partnership">Partnership</option>
                  </Input>
                </FormGroup>
                
                <Button 
                  color="primary" 
                  type="submit" 
                  block 
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </Form>
              
              <div className="text-center mt-3">
                <p>
                  Already have an account?{' '}
                  <Link to="/seller/login">Login here</Link>
                </p>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SellerRegister;