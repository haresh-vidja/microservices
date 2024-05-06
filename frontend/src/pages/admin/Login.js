import React, { useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  CardBody, 
  CardTitle, 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Button, 
  Alert,
  Spinner
} from 'reactstrap';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    try {
      const response = await axios.post('/api/admin/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        const { token, admin } = response.data.data;
        
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminInfo', JSON.stringify(admin));
        
        toast.success('Login successful!');
        history.push('/admin/dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col md="6" lg="4">
            <Card className="shadow-lg border-0">
              <CardBody className="p-4">
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-circle mb-3" 
                       style={{ width: '64px', height: '64px' }}>
                    <i className="fas fa-shield-alt fa-2x"></i>
                  </div>
                  <CardTitle tag="h3" className="mb-1">Admin Portal</CardTitle>
                  <p className="text-muted">Sign in to manage your platform</p>
                </div>

                {error && <Alert color="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <FormGroup>
                    <Label for="email">Email Address</Label>
                    <Input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </FormGroup>

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
                      disabled={loading}
                    />
                  </FormGroup>

                  <Button
                    type="submit"
                    color="dark"
                    size="lg"
                    block
                    disabled={loading}
                    className="mt-4"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt mr-2"></i>
                        Sign In
                      </>
                    )}
                  </Button>
                </Form>

                <hr className="my-4" />

                <div className="text-center">
                  <small className="text-muted">
                    <i className="fas fa-info-circle mr-1"></i>
                    Authorized personnel only
                  </small>
                </div>

                {/* Demo Credentials */}
                <div className="mt-3 p-3 bg-light rounded">
                  <small className="text-muted d-block mb-2">
                    <strong>Demo Credentials:</strong>
                  </small>
                  <small className="d-block">
                    <strong>Super Admin:</strong> admin@example.com / admin123
                  </small>
                  <small className="d-block">
                    <strong>Manager:</strong> manager@example.com / manager123
                  </small>
                  <small className="d-block">
                    <strong>Moderator:</strong> moderator@example.com / moderator123
                  </small>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLogin;