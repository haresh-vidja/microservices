/**
 * Cart Service
 * Centralized cart management with backend synchronization
 * Handles both guest and authenticated user carts
 */

import axios from 'axios';
import { toast } from 'react-toastify';

class CartService {
  constructor() {
    this.GUEST_CART_KEY = 'guestCart';
    this.CART_CACHE_KEY = 'cartCache';
    this.cartCache = null;
    this.cacheTimeout = null;
  }

  /**
   * Initialize cart based on authentication status
   */
  async initializeCart() {
    try {
      const customerToken = localStorage.getItem('customerToken');
      
      if (customerToken) {
        // User is logged in - fetch from backend
        return await this.fetchBackendCart(customerToken);
      } else {
        // Guest user - use localStorage
        return this.getGuestCart();
      }
    } catch (error) {
      console.error('Cart initialization error:', error);
      return { items: [], totalItems: 0, totalAmount: 0 };
    }
  }

  /**
   * Fetch cart from backend API
   */
  async fetchBackendCart(token) {
    try {
      const response = await axios.get('/api/orders/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const cart = response.data.data || { items: [], totalItems: 0, totalAmount: 0 };
        // Cache the cart data
        this.cartCache = cart;
        localStorage.setItem(this.CART_CACHE_KEY, JSON.stringify(cart));
        return cart;
      }
      return { items: [], totalItems: 0, totalAmount: 0 };
    } catch (error) {
      if (error.response?.status === 404) {
        // No cart exists yet
        return { items: [], totalItems: 0, totalAmount: 0 };
      }
      throw error;
    }
  }

  /**
   * Get guest cart from localStorage
   */
  getGuestCart() {
    const guestCart = JSON.parse(localStorage.getItem(this.GUEST_CART_KEY) || '[]');
    const totalItems = guestCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = guestCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      items: guestCart,
      totalItems,
      totalAmount
    };
  }

  /**
   * Add item to cart
   */
  async addToCart(product, quantity = 1) {
    const customerToken = localStorage.getItem('customerToken');
    
    if (customerToken) {
      // Logged in user - save to backend
      try {
        const response = await axios.post(
          '/api/orders/cart/add',
          { 
            productId: product._id || product.id,
            quantity 
          },
          {
            headers: { 
              Authorization: `Bearer ${customerToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          toast.success('Product added to cart!');
          // Update cache
          await this.fetchBackendCart(customerToken);
          // Emit event for UI updates
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          return response.data.data;
        }
      } catch (error) {
        console.error('Add to cart error:', error);
        toast.error(error.response?.data?.message || 'Failed to add to cart');
        throw error;
      }
    } else {
      // Guest user - save to localStorage
      const guestCart = JSON.parse(localStorage.getItem(this.GUEST_CART_KEY) || '[]');
      const existingItem = guestCart.find(item => 
        (item._id === product._id) || (item.id === product.id)
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        guestCart.push({
          ...product,
          productId: product._id || product.id,
          quantity,
          price: product.price,
          productName: product.name,
          productImage: product.images?.[0]?.url || product.images?.[0] || null
        });
      }
      
      localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(guestCart));
      toast.success('Product added to cart!');
      
      // Emit event for UI updates
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      return this.getGuestCart();
    }
  }

  /**
   * Update cart item quantity
   */
  async updateQuantity(productId, quantity) {
    const customerToken = localStorage.getItem('customerToken');
    
    if (customerToken) {
      // Logged in user - update in backend
      try {
        const response = await axios.put(
          '/api/orders/cart/update',
          { productId, quantity },
          {
            headers: { 
              Authorization: `Bearer ${customerToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          // Update cache
          await this.fetchBackendCart(customerToken);
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          return response.data.data;
        }
      } catch (error) {
        console.error('Update quantity error:', error);
        toast.error('Failed to update quantity');
        throw error;
      }
    } else {
      // Guest user - update in localStorage
      const guestCart = JSON.parse(localStorage.getItem(this.GUEST_CART_KEY) || '[]');
      const item = guestCart.find(item => 
        item.productId === productId || item._id === productId || item.id === productId
      );
      
      if (item) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          const index = guestCart.indexOf(item);
          guestCart.splice(index, 1);
        } else {
          item.quantity = quantity;
        }
        
        localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(guestCart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        return this.getGuestCart();
      }
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(productId) {
    const customerToken = localStorage.getItem('customerToken');
    
    if (customerToken) {
      // Logged in user - remove from backend
      try {
        const response = await axios.delete(
          '/api/orders/cart/remove',
          {
            headers: { 
              Authorization: `Bearer ${customerToken}`,
              'Content-Type': 'application/json'
            },
            data: { productId }
          }
        );

        if (response.data.success) {
          toast.success('Item removed from cart');
          // Update cache
          await this.fetchBackendCart(customerToken);
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          return true;
        }
      } catch (error) {
        console.error('Remove from cart error:', error);
        toast.error('Failed to remove item');
        throw error;
      }
    } else {
      // Guest user - remove from localStorage
      const guestCart = JSON.parse(localStorage.getItem(this.GUEST_CART_KEY) || '[]');
      const filteredCart = guestCart.filter(item => 
        item.productId !== productId && item._id !== productId && item.id !== productId
      );
      
      localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(filteredCart));
      toast.success('Item removed from cart');
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      return true;
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart() {
    const customerToken = localStorage.getItem('customerToken');
    
    if (customerToken) {
      // Logged in user - clear in backend
      try {
        const response = await axios.delete(
          '/api/orders/cart/clear',
          {
            headers: { 
              Authorization: `Bearer ${customerToken}`
            }
          }
        );

        if (response.data.success) {
          toast.success('Cart cleared');
          // Clear cache
          this.cartCache = { items: [], totalItems: 0, totalAmount: 0 };
          localStorage.removeItem(this.CART_CACHE_KEY);
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          return true;
        }
      } catch (error) {
        console.error('Clear cart error:', error);
        toast.error('Failed to clear cart');
        throw error;
      }
    } else {
      // Guest user - clear localStorage
      localStorage.removeItem(this.GUEST_CART_KEY);
      toast.success('Cart cleared');
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      return true;
    }
  }

  /**
   * Merge guest cart with user cart on login
   */
  async mergeCartOnLogin(token) {
    try {
      const guestCart = JSON.parse(localStorage.getItem(this.GUEST_CART_KEY) || '[]');
      
      if (guestCart.length > 0) {
        // Add each guest cart item to backend cart
        for (const item of guestCart) {
          try {
            await axios.post(
              '/api/orders/cart/add',
              { 
                productId: item.productId || item._id || item.id,
                quantity: item.quantity 
              },
              {
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (error) {
            console.error('Failed to merge cart item:', item, error);
          }
        }
        
        // Clear guest cart after merge
        localStorage.removeItem(this.GUEST_CART_KEY);
        toast.success('Cart items have been saved to your account');
      }
      
      // Fetch updated cart from backend
      return await this.fetchBackendCart(token);
    } catch (error) {
      console.error('Cart merge error:', error);
      // Continue even if merge fails
      return await this.fetchBackendCart(token);
    }
  }

  /**
   * Clear all cart data on logout
   */
  clearAllCartData() {
    // Clear all cart-related localStorage items
    localStorage.removeItem(this.GUEST_CART_KEY);
    localStorage.removeItem(this.CART_CACHE_KEY);
    localStorage.removeItem('cartItems'); // Legacy key
    
    // Clear cache
    this.cartCache = null;
    
    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }

  /**
   * Get cart count for header badge
   */
  async getCartCount() {
    try {
      const cart = await this.initializeCart();
      return cart.totalItems || 0;
    } catch (error) {
      console.error('Get cart count error:', error);
      return 0;
    }
  }

  /**
   * Check if product is in cart
   */
  async isInCart(productId) {
    try {
      const cart = await this.initializeCart();
      return cart.items.some(item => 
        item.productId === productId || item._id === productId || item.id === productId
      );
    } catch (error) {
      console.error('Check cart error:', error);
      return false;
    }
  }
}

// Export singleton instance
const cartService = new CartService();
export default cartService;