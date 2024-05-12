import React, { useEffect } from 'react';
import { Switch, Route, Redirect, useHistory } from 'react-router-dom';

// Admin Pages
import AdminLogin from './Login';
import AdminForgotPassword from './ForgotPassword';
import AdminDashboard from './Dashboard';
import AdminCustomers from './Customers';
import AdminSellers from './Sellers';
import AdminProducts from './Products';
import AdminOrders from './Orders';

const AdminApp = () => {
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const currentPath = window.location.pathname;
    
    if (!token && currentPath !== '/admin/login') {
      history.push('/admin/login');
    }
  }, [history]);

  return (
    <Switch>
      <Route exact path="/admin/login" component={AdminLogin} />
      <Route exact path="/admin/forgot-password" component={AdminForgotPassword} />
      
      {/* Protected Admin Routes */}
      <Route exact path="/admin" render={() => <Redirect to="/admin/dashboard" />} />
      <Route exact path="/admin/dashboard" component={AdminDashboard} />
      <Route exact path="/admin/customers" component={AdminCustomers} />
      <Route exact path="/admin/sellers" component={AdminSellers} />
      <Route exact path="/admin/products" component={AdminProducts} />
      <Route exact path="/admin/orders" component={AdminOrders} />
      
      {/* Analytics and Settings placeholder routes */}
      <Route exact path="/admin/analytics" render={() => 
        <AdminDashboard />
      } />
      <Route exact path="/admin/settings" render={() => 
        <AdminDashboard />
      } />
      <Route exact path="/admin/profile" render={() => 
        <AdminDashboard />
      } />
      
      {/* Fallback */}
      <Route path="/admin/*" render={() => <Redirect to="/admin/dashboard" />} />
    </Switch>
  );
};

export default AdminApp;