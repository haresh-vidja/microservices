import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const SellerForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const history = useHistory();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:3002/api/v1/sellers/forgot-password', formData);
      
      if (response.data.success) {
        setSuccess('Password reset instructions have been sent to your email address.');
        toast.success('Password reset email sent successfully!');
        setTimeout(() => {
          history.push('/seller/login');
        }, 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md="6" lg="4">
          <Card>
            <CardBody className="p-4">
              <div className="text-center mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-3" 
                     style={{ width: '64px', height: '64px' }}>
                  <i className="fas fa-key fa-2x"></i>
                </div>
                <h3 className="mb-1">Reset Password</h3>
                <p className="text-muted">Enter your email to reset your password</p>
              </div>

                {error && <Alert color="danger">{error}</Alert>}
                {success && <Alert color="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <FormGroup>
                    <Label for="email">Email Address</Label>
                    <Input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="seller@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading || success}
                    />
                  </FormGroup>

                  <Button
                    type="submit"
                    color="success"
                    block
                    disabled={loading || success}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Sending Reset Email...
                      </>
                    ) : success ? (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        Email Sent
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Send Reset Email
                      </>
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-3">
                  <Link to="/seller/login">
                    Back to Login
                  </Link>
                </div>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    Don't have an account?{' '}
                    <Link to="/seller/register">
                      Register here
                    </Link>
                  </small>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
  );
};

export default SellerForgotPassword;