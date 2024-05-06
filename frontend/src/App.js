import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <div className="App d-flex flex-column min-vh-100">
        <Header />
        <main className="flex-grow-1">
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
        <Footer />
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
    </Router>
  );
}

export default App;