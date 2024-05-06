import React, { useState, useEffect } from 'react';
import { Nav, NavItem, NavLink, Badge } from 'reactstrap';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminSidebar.css';

const AdminSidebar = ({ isOpen }) => {
  const location = useLocation();
  const [stats, setStats] = useState({
    customers: 0,
    sellers: 0,
    products: 0,
    orders: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await axios.get('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const overview = response.data.data.overview;
        setStats({
          customers: overview.customers?.total || 0,
          sellers: overview.sellers?.total || 0,
          products: overview.products?.total || 0,
          orders: overview.orders?.total || 0
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const menuItems = [
    {
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      badge: null
    },
    {
      path: '/admin/customers',
      name: 'Customers',
      icon: 'fas fa-users',
      badge: stats.customers > 0 ? { text: stats.customers.toString(), color: 'info' } : null
    },
    {
      path: '/admin/sellers',
      name: 'Sellers',
      icon: 'fas fa-store',
      badge: stats.sellers > 0 ? { text: stats.sellers.toString(), color: 'success' } : null
    },
    {
      path: '/admin/products',
      name: 'Products',
      icon: 'fas fa-box',
      badge: stats.products > 0 ? { text: stats.products.toString(), color: 'primary' } : null
    },
    {
      path: '/admin/orders',
      name: 'Orders',
      icon: 'fas fa-shopping-cart',
      badge: stats.orders > 0 ? { text: stats.orders.toString(), color: 'warning' } : null
    },
    {
      path: '/admin/analytics',
      name: 'Analytics',
      icon: 'fas fa-chart-line',
      badge: null
    },
    {
      path: '/admin/settings',
      name: 'Settings',
      icon: 'fas fa-cog',
      badge: null
    }
  ];

  return (
    <div className={`admin-sidebar bg-dark ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Nav vertical className="py-3">
        {menuItems.map((item, index) => (
          <NavItem key={index}>
            <NavLink 
              tag={Link}
              to={item.path}
              className={`text-light sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">
                <i className={item.icon}></i>
              </span>
              {isOpen && (
                <>
                  <span className="sidebar-text ml-3">{item.name}</span>
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

export default AdminSidebar;