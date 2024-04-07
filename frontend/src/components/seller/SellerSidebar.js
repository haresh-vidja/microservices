import React from 'react';
import { Nav, NavItem, NavLink, Badge } from 'reactstrap';
import { useLocation, Link } from 'react-router-dom';
import './SellerSidebar.css';

const SellerSidebar = ({ isOpen }) => {
  const location = useLocation();

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
      badge: { text: '12', color: 'primary' }
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
      badge: { text: '3', color: 'danger' }
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