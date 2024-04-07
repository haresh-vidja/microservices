import React, { useState } from 'react';
import { Card, CardBody, CardTitle, Form, FormGroup, Label, Input, Button, Row, Col, Alert, CustomInput } from 'reactstrap';
import { toast } from 'react-toastify';

const SellerSettings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      emailOrders: true,
      emailProducts: true,
      emailPromotions: false,
      smsOrders: false,
      smsShipping: false
    },
    privacy: {
      showEmail: false,
      showPhone: false,
      showAddress: true
    },
    store: {
      autoConfirmOrders: false,
      allowReturns: true,
      returnPeriod: 30,
      shippingMethod: 'standard'
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const saveSettings = () => {
    // Save settings to backend
    toast.success('Settings saved successfully');
  };

  const updatePassword = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    // Update password via API
    toast.success('Password updated successfully');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <div>
      <h2 className="mb-4">Settings</h2>

      <Row>
        <Col md="6">
          <Card className="mb-4">
            <CardBody>
              <CardTitle tag="h5">📧 Notification Preferences</CardTitle>
              <Form>
                <h6 className="text-muted">Email Notifications</h6>
                <FormGroup>
                  <CustomInput
                    type="switch"
                    id="emailOrders"
                    label="New orders"
                    checked={settings.notifications.emailOrders}
                    onChange={(e) => handleSettingChange('notifications', 'emailOrders', e.target.checked)}
                  />
                </FormGroup>
                <FormGroup>
                  <CustomInput
                    type="switch"
                    id="emailProducts"
                    label="Product updates"
                    checked={settings.notifications.emailProducts}
                    onChange={(e) => handleSettingChange('notifications', 'emailProducts', e.target.checked)}
                  />
                </FormGroup>
                <FormGroup>
                  <CustomInput
                    type="switch"
                    id="emailPromotions"
                    label="Promotional emails"
                    checked={settings.notifications.emailPromotions}
                    onChange={(e) => handleSettingChange('notifications', 'emailPromotions', e.target.checked)}
                  />
                </FormGroup>

                <h6 className="text-muted mt-4">SMS Notifications</h6>
                <FormGroup>
                  <CustomInput
                    type="switch"
                    id="smsOrders"
                    label="Order alerts"
                    checked={settings.notifications.smsOrders}
                    onChange={(e) => handleSettingChange('notifications', 'smsOrders', e.target.checked)}
                  />
                </FormGroup>
                <FormGroup>
                  <CustomInput
                    type="switch"
                    id="smsShipping"
                    label="Shipping updates"
                    checked={settings.notifications.smsShipping}
                    onChange={(e) => handleSettingChange('notifications', 'smsShipping', e.target.checked)}
                  />
                </FormGroup>
              </Form>
            </CardBody>
          </Card>

          <Card className="mb-4">
            <CardBody>
              <CardTitle tag="h5">🔒 Privacy Settings</CardTitle>
              <Form>
                <FormGroup>
                  <CustomInput
                    type="switch"
                    id="showEmail"
                    label="Show email to customers"
                    checked={settings.privacy.showEmail}
                    onChange={(e) => handleSettingChange('privacy', 'showEmail', e.target.checked)}
                  />
                </FormGroup>
                <FormGroup>
                  <CustomInput
                    type="switch"
                    id="showPhone"
                    label="Show phone number to customers"
                    checked={settings.privacy.showPhone}
                    onChange={(e) => handleSettingChange('privacy', 'showPhone', e.target.checked)}
                  />
                </FormGroup>
                <FormGroup>
                  <CustomInput
                    type="switch"
                    id="showAddress"
                    label="Show business address"
                    checked={settings.privacy.showAddress}
                    onChange={(e) => handleSettingChange('privacy', 'showAddress', e.target.checked)}
                  />
                </FormGroup>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col md="6">
          <Card className="mb-4">
            <CardBody>
              <CardTitle tag="h5">🏪 Store Settings</CardTitle>
              <Form>
                <FormGroup>
                  <CustomInput
                    type="switch"
                    id="autoConfirmOrders"
                    label="Auto-confirm orders"
                    checked={settings.store.autoConfirmOrders}
                    onChange={(e) => handleSettingChange('store', 'autoConfirmOrders', e.target.checked)}
                  />
                </FormGroup>
                <FormGroup>
                  <CustomInput
                    type="switch"
                    id="allowReturns"
                    label="Allow returns"
                    checked={settings.store.allowReturns}
                    onChange={(e) => handleSettingChange('store', 'allowReturns', e.target.checked)}
                  />
                </FormGroup>
                {settings.store.allowReturns && (
                  <FormGroup>
                    <Label for="returnPeriod">Return period (days)</Label>
                    <Input
                      type="number"
                      id="returnPeriod"
                      value={settings.store.returnPeriod}
                      onChange={(e) => handleSettingChange('store', 'returnPeriod', e.target.value)}
                      min="1"
                      max="90"
                    />
                  </FormGroup>
                )}
                <FormGroup>
                  <Label for="shippingMethod">Default Shipping Method</Label>
                  <Input
                    type="select"
                    id="shippingMethod"
                    value={settings.store.shippingMethod}
                    onChange={(e) => handleSettingChange('store', 'shippingMethod', e.target.value)}
                  >
                    <option value="standard">Standard Shipping</option>
                    <option value="express">Express Shipping</option>
                    <option value="overnight">Overnight Shipping</option>
                    <option value="pickup">Store Pickup</option>
                  </Input>
                </FormGroup>
              </Form>
              <Button color="primary" onClick={saveSettings}>
                Save Store Settings
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle tag="h5">🔑 Change Password</CardTitle>
              <Form onSubmit={updatePassword}>
                <FormGroup>
                  <Label for="currentPassword">Current Password</Label>
                  <Input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="newPassword">New Password</Label>
                  <Input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="confirmPassword">Confirm New Password</Label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </FormGroup>
                <Button color="success" type="submit">
                  Update Password
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SellerSettings;