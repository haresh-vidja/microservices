import React, { useState, useEffect } from 'react';
import { Nav, NavItem, NavLink, Badge } from 'reactstrap';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import './SellerSidebar.css';

const SellerSidebar = ({ isOpen, refreshTrigger }) => {
  const location = useLocation();
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    fetchCounts();
  }, [refreshTrigger]);

  // Also refresh counts when location changes (user navigates)
  useEffect(() => {
    fetchCounts();
  }, [location.pathname]);

  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('sellerData') || '{}');
      
      console.log('Sidebar: sellerData:', sellerData);
      console.log('Sidebar: expected alex.tech sellerId should be: 6895fc2fc8976794b14a5fce');
      
      if (!token || !sellerData.id) {
        return;
      }

      // Fetch products count
      const productsResponse = await axios.get(`/api/products/products/seller/${sellerData.id}?status=active&limit=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (productsResponse.data.success) {
        setProductCount(productsResponse.data.data.summary.active || 0);
      }
    } catch (error) {
      console.error('Error fetching sidebar counts:', error);
    }
  };

  const menuItems = [
    {
      path: '/seller/dashboard',
      name: 'Dashboard',
      icon: '📊',
      badge: null
    },
    {
      path: '/seller/products',
      name: 'Products',
      icon: '📦',
      badge: productCount > 0 ? { text: productCount.toString(), color: 'primary' } : null
    },
    {
      path: '/seller/add-product',
      name: 'Add Product',
      icon: '➕',
      badge: null
    },
    {
      path: '/seller/orders',
      name: 'Orders',
      icon: '📋',
      badge: orderCount > 0 ? { text: orderCount.toString(), color: 'danger' } : null
    },
    {
      path: '/seller/profile',
      name: 'Profile',
      icon: '👤',
      badge: null
    }
  ];

  return (
    <div className={`seller-sidebar bg-dark ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Nav vertical className="py-3">
        {menuItems.map((item, index) => (
          <NavItem key={index}>
            <NavLink 
              tag={Link}
              to={item.path}
              className={`text-white sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {isOpen && (
                <>
                  <span className="sidebar-text ml-2">{item.name}</span>
                  {item.badge && (
                    <Badge color={item.badge.color} className="ml-auto">
                      {item.badge.text}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
    </div>
  );
};

export default SellerSidebar;