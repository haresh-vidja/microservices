import React from 'react';
import { BrowserRouter as Router, Route, Switch, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import CustomerLogin from './pages/customer/Login';
import CustomerRegister from './pages/customer/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Profile from './pages/customer/Profile';
import SellerApp from './pages/seller/SellerApp';
import AdminApp from './pages/admin/AdminApp';

function AppContent() {
  const location = useLocation();
  
  // Check if current route is seller or admin related
  const isSellerRoute = location.pathname.startsWith('/seller');
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Check authentication status to determine if user is logged in
  const isSellerLoggedIn = localStorage.getItem('sellerToken') !== null;
  const isAdminLoggedIn = localStorage.getItem('adminToken') !== null;
  
  // Hide header and footer for authenticated seller and admin users
  const shouldHideHeaderFooter = 
    (isSellerRoute && isSellerLoggedIn) || 
    (isAdminRoute && isAdminLoggedIn);

  return (
    <div className="App d-flex flex-column min-vh-100">
      {!shouldHideHeaderFooter && <Header />}
      <main className={shouldHideHeaderFooter ? "vh-100" : "flex-grow-1"}>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/customer/login" component={CustomerLogin} />
          <Route path="/customer/register" component={CustomerRegister} />
          <Route path="/customer/profile" component={Profile} />
          <Route path="/seller" component={SellerApp} />
          <Route path="/admin" component={AdminApp} />
          <Route path="/products" component={Products} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/cart" component={Cart} />
        </Switch>
      </main>
      {!shouldHideHeaderFooter && <Footer />}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;