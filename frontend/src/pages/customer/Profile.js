import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  CardBody, 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Button, 
  Alert,
  Badge,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from 'reactstrap';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ImageUploader from '../../components/common/ImageUploader';

const CustomerProfile = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    profileImage: null
  });
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    contactName: '',
    contactPhone: '',
    landmark: '',
    deliveryInstructions: '',
    isDefault: false
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      history.push('/customer/login');
      return;
    }
    fetchCustomerProfile();
    fetchAddresses();
  }, [history]);

  const fetchCustomerProfile = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      const response = await axios.get('/api/customer/customers/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const customerData = response.data.data;
        setProfile({
          firstName: customerData.firstName || '',
          lastName: customerData.lastName || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          dateOfBirth: customerData.dateOfBirth ? customerData.dateOfBirth.split('T')[0] : '',
          gender: customerData.gender || 'male',
          profileImage: customerData.profileImage || null
        });
        
        // Update localStorage with fresh data
        localStorage.setItem('customerData', JSON.stringify(customerData));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('customerToken');
        history.push('/customer/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      const response = await axios.get('/api/customer/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAddresses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress({
      ...newAddress,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleProfileImageUpload = (uploadedImage) => {
    setProfile({
      ...profile,
      profileImage: uploadedImage.media_id
    });
  };

  const handleProfileImageRemove = () => {
    setProfile({
      ...profile,
      profileImage: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('customerToken');
      const response = await axios.put('/api/customer/customers/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        localStorage.setItem('customerData', JSON.stringify(response.data.data));
        setEditing(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('customerToken');
      const response = await axios.post('/api/customer/addresses', newAddress, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Address added successfully!');
        fetchAddresses();
        setShowAddressForm(false);
        setNewAddress({
          type: 'home',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          contactName: '',
          contactPhone: '',
          landmark: '',
          deliveryInstructions: '',
          isDefault: false
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add address.';
      toast.error(errorMessage);
    }
  };

  const deleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const token = localStorage.getItem('customerToken');
      await axios.delete(`/api/customer/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Address deleted successfully!');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const toggleTab = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Profile Header */}
      <Card className="mb-4">
        <CardBody>
          <Row className="align-items-center">
            <Col md="2">
              {profile.profileImage ? (
                <img 
                  src={`http://localhost:8000/media/${profile.profileImage}`}
                  alt="Profile"
                  className="img-thumbnail rounded-circle"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
              ) : (
                <div className="text-center p-4 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                  <i className="fas fa-user fa-3x text-muted"></i>
                </div>
              )}
            </Col>
            <Col md="7">
              <h3 className="mb-1">{profile.firstName} {profile.lastName}</h3>
              <p className="text-muted mb-2">
                <i className="fas fa-envelope me-2"></i>
                {profile.email}
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Badge color="primary">Customer</Badge>
                <Badge color="success">
                  <i className="fas fa-check-circle me-1"></i>
                  Active Member
                </Badge>
                {addresses.length > 0 && (
                  <Badge color="info">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    {addresses.length} Address{addresses.length > 1 ? 'es' : ''}
                  </Badge>
                )}
              </div>
            </Col>
            <Col md="3" className="text-end">
              {!editing ? (
                <Button 
                  color="primary" 
                  onClick={() => setEditing(true)}
                >
                  <i className="fas fa-edit me-2"></i>
                  Edit Profile
                </Button>
              ) : (
                <div>
                  <Button 
                    color="secondary" 
                    className="me-2"
                    onClick={() => {
                      setEditing(false);
                      fetchCustomerProfile();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    color="success" 
                    onClick={handleSubmit}
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Navigation Tabs */}
      <Nav tabs className="mb-3">
        <NavItem>
          <NavLink
            className={activeTab === '1' ? 'active' : ''}
            onClick={() => toggleTab('1')}
          >
            Personal Information
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === '2' ? 'active' : ''}
            onClick={() => toggleTab('2')}
          >
            Addresses
          </NavLink>
        </NavItem>
      </Nav>

      {error && <Alert color="danger">{error}</Alert>}

      {/* Tab Content */}
      <Form onSubmit={handleSubmit}>
        <TabContent activeTab={activeTab}>
          {/* Personal Information Tab */}
          <TabPane tabId="1">
            <Row>
              <Col md="8">
                <Card>
                  <CardBody>
                    <h5 className="mb-3">Personal Details</h5>
                    <Row>
                      <Col md="6">
                        <FormGroup>
                          <Label for="firstName">First Name</Label>
                          <Input
                            type="text"
                            name="firstName"
                            id="firstName"
                            value={profile.firstName}
                            onChange={handleChange}
                            disabled={!editing}
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
                            value={profile.lastName}
                            onChange={handleChange}
                            disabled={!editing}
                            required
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    
                    <FormGroup>
                      <Label for="email">Email Address</Label>
                      <Input
                        type="email"
                        name="email"
                        id="email"
                        value={profile.email}
                        disabled
                        title="Email cannot be changed"
                      />
                      <small className="text-muted">Email address cannot be changed</small>
                    </FormGroup>
                    
                    <Row>
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
                      <Col md="6">
                        <FormGroup>
                          <Label for="gender">Gender</Label>
                          <Input
                            type="select"
                            name="gender"
                            id="gender"
                            value={profile.gender}
                            onChange={handleChange}
                            disabled={!editing}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </Input>
                        </FormGroup>
                      </Col>
                    </Row>
                    
                    <FormGroup>
                      <Label for="dateOfBirth">Date of Birth</Label>
                      <Input
                        type="date"
                        name="dateOfBirth"
                        id="dateOfBirth"
                        value={profile.dateOfBirth}
                        onChange={handleChange}
                        disabled={!editing}
                      />
                    </FormGroup>
                  </CardBody>
                </Card>
              </Col>
              
              <Col md="4">
                <Card>
                  <CardBody>
                    <h5 className="mb-3">Profile Picture</h5>
                    {editing ? (
                      <ImageUploader
                        onUpload={handleProfileImageUpload}
                        onRemove={handleProfileImageRemove}
                        currentMediaId={profile.profileImage}
                        uploadType="profile"
                        maxSize={2 * 1024 * 1024}
                        className="mb-3"
                      />
                    ) : (
                      <div className="text-center">
                        {profile.profileImage ? (
                          <img 
                            src={`http://localhost:8000/media/${profile.profileImage}`}
                            alt="Profile"
                            className="img-fluid rounded"
                            style={{ maxHeight: '200px' }}
                          />
                        ) : (
                          <div className="p-5 bg-light rounded">
                            <i className="fas fa-user fa-3x text-muted"></i>
                            <p className="text-muted mt-2">No profile picture</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Addresses Tab */}
          <TabPane tabId="2">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>My Addresses</h5>
              <Button 
                color="success" 
                onClick={() => setShowAddressForm(!showAddressForm)}
              >
                <i className="fas fa-plus me-2"></i>
                Add New Address
              </Button>
            </div>

            {/* Add Address Form */}
            {showAddressForm && (
              <Card className="mb-4">
                <CardBody>
                  <h6>Add New Address</h6>
                  <Form onSubmit={handleAddressSubmit}>
                    <Row>
                      <Col md="6">
                        <FormGroup>
                          <Label for="type">Address Type</Label>
                          <Input
                            type="select"
                            name="type"
                            value={newAddress.type}
                            onChange={handleAddressChange}
                          >
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col md="6">
                        <FormGroup>
                          <Label for="contactName">Contact Name</Label>
                          <Input
                            type="text"
                            name="contactName"
                            value={newAddress.contactName}
                            onChange={handleAddressChange}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <FormGroup>
                      <Label for="addressLine1">Address Line 1</Label>
                      <Input
                        type="text"
                        name="addressLine1"
                        value={newAddress.addressLine1}
                        onChange={handleAddressChange}
                        required
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label for="addressLine2">Address Line 2 (Optional)</Label>
                      <Input
                        type="text"
                        name="addressLine2"
                        value={newAddress.addressLine2}
                        onChange={handleAddressChange}
                      />
                    </FormGroup>

                    <Row>
                      <Col md="6">
                        <FormGroup>
                          <Label for="city">City</Label>
                          <Input
                            type="text"
                            name="city"
                            value={newAddress.city}
                            onChange={handleAddressChange}
                            required
                          />
                        </FormGroup>
                      </Col>
                      <Col md="6">
                        <FormGroup>
                          <Label for="state">State</Label>
                          <Input
                            type="text"
                            name="state"
                            value={newAddress.state}
                            onChange={handleAddressChange}
                            required
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md="6">
                        <FormGroup>
                          <Label for="country">Country</Label>
                          <Input
                            type="text"
                            name="country"
                            value={newAddress.country}
                            onChange={handleAddressChange}
                            required
                          />
                        </FormGroup>
                      </Col>
                      <Col md="6">
                        <FormGroup>
                          <Label for="postalCode">Postal Code</Label>
                          <Input
                            type="text"
                            name="postalCode"
                            value={newAddress.postalCode}
                            onChange={handleAddressChange}
                            required
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <FormGroup>
                      <Input
                        type="checkbox"
                        name="isDefault"
                        checked={newAddress.isDefault}
                        onChange={handleAddressChange}
                      />
                      <Label for="isDefault" className="ms-2">Set as default address</Label>
                    </FormGroup>

                    <div>
                      <Button type="submit" color="success" className="me-2">
                        Save Address
                      </Button>
                      <Button 
                        type="button" 
                        color="secondary" 
                        onClick={() => setShowAddressForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            )}

            {/* Address List */}
            <Row>
              {addresses.length === 0 ? (
                <Col>
                  <Card>
                    <CardBody className="text-center py-5">
                      <i className="fas fa-map-marker-alt fa-3x text-muted mb-3"></i>
                      <h5>No addresses added yet</h5>
                      <p className="text-muted">Add your first address to get started with deliveries</p>
                    </CardBody>
                  </Card>
                </Col>
              ) : (
                addresses.map((address) => (
                  <Col md="6" key={address.id} className="mb-3">
                    <Card>
                      <CardBody>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <Badge color={address.type === 'home' ? 'primary' : address.type === 'work' ? 'info' : 'secondary'}>
                              <i className={`fas fa-${address.type === 'home' ? 'home' : address.type === 'work' ? 'briefcase' : 'map-marker-alt'} me-1`}></i>
                              {address.type.toUpperCase()}
                            </Badge>
                            {address.isDefault && (
                              <Badge color="success" className="ms-2">DEFAULT</Badge>
                            )}
                          </div>
                          <Button 
                            color="danger" 
                            size="sm"
                            onClick={() => deleteAddress(address.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                        
                        {address.contactName && (
                          <p className="mb-1"><strong>{address.contactName}</strong></p>
                        )}
                        
                        <p className="mb-1">
                          {address.addressLine1}
                          {address.addressLine2 && <><br/>{address.addressLine2}</>}
                        </p>
                        
                        <p className="mb-1">
                          {address.city}, {address.state}
                        </p>
                        
                        <p className="mb-0">
                          {address.country} - {address.postalCode}
                        </p>
                        
                        {address.contactPhone && (
                          <p className="text-muted mb-0 mt-2">
                            <i className="fas fa-phone me-1"></i>
                            {address.contactPhone}
                          </p>
                        )}
                      </CardBody>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          </TabPane>
        </TabContent>
      </Form>
    </Container>
  );
};

export default CustomerProfile;