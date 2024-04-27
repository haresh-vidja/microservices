import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Button, 
  Row, 
  Col,
  Badge,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Container
} from 'reactstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import ImageUploader from '../../components/common/ImageUploader';

const SellerProfile = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: 'individual',
    description: '',
    logoMediaId: null,
    website: '',
    industry: '',
    establishedDate: '',
    employeeCount: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('1');

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
        const { seller, business } = response.data.data;
        
        // Merge seller and business data into profile state
        setProfile({
          firstName: seller.firstName || '',
          lastName: seller.lastName || '',
          email: seller.email || '',
          phone: seller.phone || business?.phone || '',
          businessName: business?.businessName || '',
          businessType: business?.businessType || 'individual',
          description: business?.description || '',
          logoMediaId: business?.logoMediaId || null,
          website: business?.website || '',
          industry: business?.industry || '',
          establishedDate: business?.establishedDate || '',
          employeeCount: business?.employeeCount || '',
          address: business?.address || {
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Check if it's an address field
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setProfile({
        ...profile,
        address: {
          ...profile.address,
          [addressField]: value
        }
      });
    } else {
      setProfile({
        ...profile,
        [name]: value
      });
    }
  };

  const handleLogoUpload = (uploadedImage) => {
    setProfile({
      ...profile,
      logoMediaId: uploadedImage.media_id
    });
  };

  const handleLogoRemove = () => {
    setProfile({
      ...profile,
      logoMediaId: null
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

  const getBusinessTypeLabel = (type) => {
    const types = {
      individual: 'Individual',
      partnership: 'Partnership',
      llc: 'Limited Liability Company',
      corporation: 'Corporation',
      other: 'Other'
    };
    return types[type] || type;
  };

  const toggleTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <Container fluid className="py-4">
      {/* Profile Header */}
      <Card className="mb-4">
        <CardBody>
          <Row className="align-items-center">
            <Col md="2">
              {profile.logoMediaId ? (
                <img 
                  src={`http://localhost:8000/media/${profile.logoMediaId}`}
                  alt="Company Logo"
                  className="img-thumbnail"
                  style={{ maxHeight: '120px', width: 'auto' }}
                />
              ) : (
                <div className="text-center p-4 bg-light rounded">
                  <i className="fas fa-building fa-3x text-muted"></i>
                </div>
              )}
            </Col>
            <Col md="7">
              <h3 className="mb-1">{profile.businessName || 'Business Name'}</h3>
              <p className="text-muted mb-2">
                <i className="fas fa-user me-2"></i>
                {profile.firstName} {profile.lastName}
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Badge color="primary">{getBusinessTypeLabel(profile.businessType)}</Badge>
                {profile.industry && <Badge color="info">{profile.industry}</Badge>}
                <Badge color="success">Verified Seller</Badge>
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
                      fetchProfile();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    color="success" 
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
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
            Overview
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === '2' ? 'active' : ''}
            onClick={() => toggleTab('2')}
          >
            Business Details
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === '3' ? 'active' : ''}
            onClick={() => toggleTab('3')}
          >
            Contact & Address
          </NavLink>
        </NavItem>
      </Nav>

      {/* Tab Content */}
      <Form onSubmit={handleSubmit}>
        <TabContent activeTab={activeTab}>
          {/* Overview Tab */}
          <TabPane tabId="1">
            <Row>
              <Col md="8">
                <Card>
                  <CardBody>
                    <h5 className="mb-3">Personal Information</h5>
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
                    <Row>
                      <Col md="6">
                        <FormGroup>
                          <Label for="email">Email Address</Label>
                          <Input
                            type="email"
                            name="email"
                            id="email"
                            value={profile.email}
                            onChange={handleChange}
                            disabled
                            title="Email cannot be changed"
                          />
                          <small className="text-muted">Email address cannot be changed</small>
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
                  </CardBody>
                </Card>
              </Col>
              
              <Col md="4">
                <Card>
                  <CardBody>
                    <h5 className="mb-3">Company Logo</h5>
                    {editing ? (
                      <ImageUploader
                        onUpload={handleLogoUpload}
                        onRemove={handleLogoRemove}
                        currentMediaId={profile.logoMediaId}
                        uploadType="logo"
                        maxSize={2 * 1024 * 1024}
                        className="mb-3"
                      />
                    ) : (
                      <div className="text-center">
                        {profile.logoMediaId ? (
                          <img 
                            src={`http://localhost:8000/media/${profile.logoMediaId}`}
                            alt="Company Logo"
                            className="img-fluid"
                            style={{ maxHeight: '200px' }}
                          />
                        ) : (
                          <div className="p-5 bg-light rounded">
                            <i className="fas fa-image fa-3x text-muted"></i>
                            <p className="text-muted mt-2">No logo uploaded</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Business Details Tab */}
          <TabPane tabId="2">
            <Card>
              <CardBody>
                <h5 className="mb-3">Business Information</h5>
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
                      <Label for="businessType">Business Type</Label>
                      <Input
                        type="select"
                        name="businessType"
                        id="businessType"
                        value={profile.businessType}
                        onChange={handleChange}
                        disabled={!editing}
                      >
                        <option value="individual">Individual</option>
                        <option value="partnership">Partnership</option>
                        <option value="llc">Limited Liability Company (LLC)</option>
                        <option value="corporation">Corporation</option>
                        <option value="other">Other</option>
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="industry">Industry</Label>
                      <Input
                        type="text"
                        name="industry"
                        id="industry"
                        value={profile.industry}
                        onChange={handleChange}
                        disabled={!editing}
                        placeholder="e.g., Electronics, Fashion"
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="website">Website</Label>
                      <Input
                        type="url"
                        name="website"
                        id="website"
                        value={profile.website}
                        onChange={handleChange}
                        disabled={!editing}
                        placeholder="https://www.example.com"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="establishedDate">Established Date</Label>
                      <Input
                        type="date"
                        name="establishedDate"
                        id="establishedDate"
                        value={profile.establishedDate ? profile.establishedDate.split('T')[0] : ''}
                        onChange={handleChange}
                        disabled={!editing}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="employeeCount">Number of Employees</Label>
                      <Input
                        type="number"
                        name="employeeCount"
                        id="employeeCount"
                        value={profile.employeeCount}
                        onChange={handleChange}
                        disabled={!editing}
                        placeholder="e.g., 10"
                        min="1"
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
              </CardBody>
            </Card>
          </TabPane>

          {/* Contact & Address Tab */}
          <TabPane tabId="3">
            <Card>
              <CardBody>
                <h5 className="mb-3">Business Address</h5>
                <FormGroup>
                  <Label for="address.street">Street Address</Label>
                  <Input
                    type="text"
                    name="address.street"
                    id="address.street"
                    value={profile.address.street}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </FormGroup>

                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="address.city">City</Label>
                      <Input
                        type="text"
                        name="address.city"
                        id="address.city"
                        value={profile.address.city}
                        onChange={handleChange}
                        disabled={!editing}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="address.state">State/Province</Label>
                      <Input
                        type="text"
                        name="address.state"
                        id="address.state"
                        value={profile.address.state}
                        onChange={handleChange}
                        disabled={!editing}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="address.postalCode">ZIP/Postal Code</Label>
                      <Input
                        type="text"
                        name="address.postalCode"
                        id="address.postalCode"
                        value={profile.address.postalCode}
                        onChange={handleChange}
                        disabled={!editing}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="address.country">Country</Label>
                      <Input
                        type="text"
                        name="address.country"
                        id="address.country"
                        value={profile.address.country}
                        onChange={handleChange}
                        disabled={!editing}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </TabPane>
        </TabContent>
      </Form>
    </Container>
  );
};

export default SellerProfile;