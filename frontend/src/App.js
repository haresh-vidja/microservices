/**
 * Main Application Component
 * 
 * @fileoverview Root component for the e-commerce microservices frontend
 * @description This component serves as the main entry point for the React application,
 * handling routing, authentication state, and layout management. It conditionally
 * renders header/footer based on user authentication and current route.
 * 
 * @author Haresh Vidja
 * @version 1.0.0
 * @since 2023-11-01
 * @requires react
 * @requires react-router-dom
 * @requires bootstrap
 * @requires react-toastify
 */

import React from 'react';
import { BrowserRouter as Router, Route, Switch, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import common layout components
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Import page components
import Home from './pages/Home';
import CustomerLogin from './pages/customer/Login';
import CustomerRegister from './pages/customer/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Profile from './pages/customer/Profile';
import SellerApp from './pages/seller/SellerApp';
import AdminApp from './pages/admin/AdminApp';

/**
 * AppContent Component
 * @description Main application content wrapper that handles routing and layout logic
 * @returns {JSX.Element} The main application content
 */
function AppContent() {
  // Get current location for route-based logic
  const location = useLocation();
  
  /**
   * Route Detection Logic
   * @description Determines if current route is for seller or admin functionality
   */
  const isSellerRoute = location.pathname.startsWith('/seller');
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  /**
   * Authentication Status Check
   * @description Checks if user is logged in as seller or admin
   */
  const isSellerLoggedIn = localStorage.getItem('sellerToken') !== null;
  const isAdminLoggedIn = localStorage.getItem('adminToken') !== null;
  
  /**
   * Header/Footer Visibility Logic
   * @description Hides header and footer for authenticated seller and admin users
   * to provide a cleaner, app-like experience
   */
  const shouldHideHeaderFooter = 
    (isSellerRoute && isSellerLoggedIn) || 
    (isAdminRoute && isAdminLoggedIn);

  return (
    <div className="App d-flex flex-column min-vh-100">
      {/* Conditionally render header based on authentication and route */}
      {!shouldHideHeaderFooter && <Header />}
      
      {/* Main content area with conditional styling */}
      <main className={shouldHideHeaderFooter ? "vh-100" : "flex-grow-1"}>
        {/* Application routing configuration */}
        <Switch>
          {/* Public routes */}
          <Route exact path="/" component={Home} />
          <Route path="/products" component={Products} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/cart" component={Cart} />
          
          {/* Customer authentication routes */}
          <Route path="/customer/login" component={CustomerLogin} />
          <Route path="/customer/register" component={CustomerRegister} />
          <Route path="/customer/profile" component={Profile} />
          
          {/* Protected application routes */}
          <Route path="/seller" component={SellerApp} />
          <Route path="/admin" component={AdminApp} />
        </Switch>
      </main>
      
      {/* Conditionally render footer based on authentication and route */}
      {!shouldHideHeaderFooter && <Footer />}
      
      {/* Global toast notifications configuration */}
      <ToastContainer 
        position="top-right"        // Position notifications in top-right corner
        autoClose={3000}           // Auto-close after 3 seconds
        hideProgressBar={false}    // Show progress bar
        newestOnTop={false}        // New notifications appear below existing ones
        closeOnClick               // Allow closing by clicking
        rtl={false}                // Left-to-right text direction
        pauseOnFocusLoss           // Pause auto-close when window loses focus
        draggable                  // Allow dragging notifications
        pauseOnHover              // Pause auto-close when hovering
      />
    </div>
  );
}

/**
 * App Component
 * @description Root component that wraps the application with routing context
 * @returns {JSX.Element} The complete application with routing
 */
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;