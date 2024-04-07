import React, { useState, useEffect } from 'react';
import { Card, CardBody, Form, FormGroup, Label, Input, Button, Row, Col, Alert } from 'reactstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const SellerProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    businessName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      const response = await axios.get('http://localhost:3002/api/v1/sellers/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('sellerToken');
      const response = await axios.put('http://localhost:3002/api/v1/sellers/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Profile updated successfully');
        setEditing(false);
        localStorage.setItem('sellerInfo', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Seller Profile</h2>
        {!editing && (
          <Button color="primary" onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardBody>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="name">Full Name</Label>
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    value={profile.name}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="email">Email</Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    value={profile.email}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="businessName">Business Name</Label>
                  <Input
                    type="text"
                    name="businessName"
                    id="businessName"
                    value={profile.businessName}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="phone">Phone Number</Label>
                  <Input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label for="address">Address</Label>
              <Input
                type="text"
                name="address"
                id="address"
                value={profile.address}
                onChange={handleChange}
                disabled={!editing}
              />
            </FormGroup>

            <Row>
              <Col md="4">
                <FormGroup>
                  <Label for="city">City</Label>
                  <Input
                    type="text"
                    name="city"
                    id="city"
                    value={profile.city}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label for="state">State</Label>
                  <Input
                    type="text"
                    name="state"
                    id="state"
                    value={profile.state}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label for="zipCode">ZIP Code</Label>
                  <Input
                    type="text"
                    name="zipCode"
                    id="zipCode"
                    value={profile.zipCode}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label for="description">Business Description</Label>
              <Input
                type="textarea"
                name="description"
                id="description"
                rows="4"
                value={profile.description}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Tell customers about your business..."
              />
            </FormGroup>

            {editing && (
              <div className="d-flex justify-content-end">
                <Button 
                  color="secondary" 
                  className="mr-2"
                  onClick={() => {
                    setEditing(false);
                    fetchProfile();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  color="success" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </Form>
        </CardBody>
      </Card>
    </div>
  );
};

export default SellerProfile;