import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import SellerLayout from '../../components/seller/SellerLayout';
import SellerDashboard from './Dashboard';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import ProductsList from './ProductsList';
import OrdersList from './OrdersList';
import SellerProfile from './Profile';
import Login from './Login';
import Register from './Register';

const SellerApp = () => {
  const isAuthenticated = () => {
    return localStorage.getItem('sellerToken') !== null;
  };

  const PublicRoute = ({ component: Component, ...rest }) => (
    <Route
      {...rest}
      render={(props) =>
        !isAuthenticated() ? (
          <Component {...props} />
        ) : (
          <Redirect to="/seller/dashboard" />
        )
      }
    />
  );

  const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated() ? (
          <SellerLayout>
            <Component {...props} />
          </SellerLayout>
        ) : (
          <Redirect to="/seller/login" />
        )
      }
    />
  );

  return (
    <Switch>
      <PublicRoute exact path="/seller/login" component={Login} />
      <PublicRoute exact path="/seller/register" component={Register} />
      
      <PrivateRoute exact path="/seller" component={SellerDashboard} />
      <PrivateRoute exact path="/seller/dashboard" component={SellerDashboard} />
      <PrivateRoute exact path="/seller/products" component={ProductsList} />
      <PrivateRoute exact path="/seller/add-product" component={AddProduct} />
      <PrivateRoute exact path="/seller/edit-product/:id" component={EditProduct} />
      <PrivateRoute exact path="/seller/orders" component={OrdersList} />
      <PrivateRoute exact path="/seller/profile" component={SellerProfile} />
      
      <Route render={() => <Redirect to="/seller/dashboard" />} />
    </Switch>
  );
};

export default SellerApp;