/**
 * Order Service Layer
 * Contains business logic for order operations
 */

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const serviceClient = require('../utils/serviceClient');
const kafkaClient = require('../utils/kafkaClient');
const logger = require('../utils/logger');

class OrderService {
  /**
   * Add item to cart
   */
  async addToCart(customerId, productId, quantity) {
    try {
      // Get product information
      const product = await serviceClient.getProduct(productId);
      
      // Check inventory availability through Products service
      const inventoryCheck = await serviceClient.checkInventory([{
        productId,
        quantity
      }]);
      
      if (!inventoryCheck.allAvailable) {
        const item = inventoryCheck.items[0];
        throw new Error(`Insufficient stock. Available: ${item.availableStock}, Requested: ${quantity}`);
      }

      // Get or create cart
      let cart = await Cart.findOne({ customerId });
      if (!cart) {
        cart = new Cart({ customerId, items: [] });
      }

      const availableStock = inventoryCheck.items[0].availableStock;

      // Add item to cart
      await cart.addItem({
        productId,
        sellerId: product.sellerId,
        quantity,
        price: product.price,
        productName: product.name,
        productImage: product.images?.[0]?.media_id,
        availableStock
      });

      logger.info(`Item added to cart: ${customerId} - ${productId}`);
      return cart;

    } catch (error) {
      logger.error('Error adding item to cart:', error);
      throw error;
    }
  }

  /**
   * Place order
   */
  async placeOrder(customerId, shippingAddressId, notes = '') {
    try {
      // Get cart
      const cart = await Cart.findOne({ customerId });
      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Get customer and address
      const customer = await serviceClient.getCustomer(customerId);
      const addresses = await serviceClient.getCustomerAddresses(customerId);
      const shippingAddress = addresses.find(addr => addr.id === shippingAddressId);
      
      if (!shippingAddress) {
        throw new Error('Shipping address not found');
      }

      // Prepare order items and check inventory
      const orderItems = [];
      const inventoryItems = [];
      
      for (const cartItem of cart.items) {
        orderItems.push({
          productId: cartItem.productId,
          sellerId: cartItem.sellerId,
          productName: cartItem.productName,
          productImage: cartItem.productImage,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
          totalPrice: cartItem.price * cartItem.quantity
        });
        
        inventoryItems.push({
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price
        });
      }

      // Check inventory availability
      const inventoryCheck = await serviceClient.checkInventory(inventoryItems);
      
      if (!inventoryCheck.allAvailable) {
        const unavailableItems = inventoryCheck.items.filter(item => !item.available);
        const itemNames = unavailableItems.map(item => 
          `${item.productName} (requested: ${item.requestedQuantity}, available: ${item.availableStock})`
        ).join(', ');
        throw new Error(`Some items are not available: ${itemNames}`);
      }

      // Create order
      const order = new Order({
        customerId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        items: orderItems,
        shippingAddress: {
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          postalCode: shippingAddress.postalCode,
          contactName: shippingAddress.contactName,
          contactPhone: shippingAddress.contactPhone
        },
        notes
      });

      order.calculateTotals();
      await order.save();

      // Reserve inventory through Products service
      try {
        await serviceClient.reserveInventory(order.id, customerId, inventoryItems, 30);
        logger.info(`Inventory reserved for order: ${order.orderNumber}`);
      } catch (reservationError) {
        // If reservation fails, cancel the order
        await order.cancelOrder('Failed to reserve inventory');
        throw new Error(`Failed to reserve inventory: ${reservationError.message}`);
      }

      // Clear cart
      await cart.clearCart();

      // Publish events
      await kafkaClient.publishOrderEvent('order_placed', order);
      
      // Send notifications
      await this.sendOrderNotifications(order);

      logger.info(`Order placed: ${order.orderNumber} by ${customerId}`);
      return order;

    } catch (error) {
      logger.error('Error placing order:', error);
      throw error;
    }
  }

  /**
   * Confirm order (convert reservations to sales)
   */
  async confirmOrder(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending') {
        throw new Error(`Cannot confirm order with status: ${order.status}`);
      }

      // Confirm inventory reservation (convert to sales)
      const inventoryItems = order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      await serviceClient.confirmInventory(orderId, inventoryItems);

      // Update order status
      order.status = 'confirmed';
      order.confirmedAt = new Date();
      await order.save();

      // Publish events
      await kafkaClient.publishOrderEvent('order_confirmed', order);

      logger.info(`Order confirmed: ${order.orderNumber}`);
      return order;

    } catch (error) {
      logger.error('Error confirming order:', error);
      throw error;
    }
  }

  /**
   * Cancel order (release reservations)
   */
  async cancelOrder(orderId, reason = 'Customer cancellation') {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

      // Release inventory reservations
      await serviceClient.releaseInventory(orderId, reason);

      // Update order status
      await order.cancelOrder(reason);

      // Publish events
      await kafkaClient.publishOrderEvent('order_cancelled', order);

      logger.info(`Order cancelled: ${order.orderNumber} - ${reason}`);
      return order;

    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Send order notifications
   */
  async sendOrderNotifications(order) {
    try {
      // Notify customer
      await kafkaClient.publishNotificationEvent('order_confirmation', {
        recipientId: order.customerId,
        recipientType: 'customer',
        orderId: order.id,
        orderNumber: order.orderNumber,
        template: 'order_confirmation',
        data: {
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          items: order.items
        }
      });

      // Notify each seller
      const sellerGroups = order.getSellerGroups();
      for (const group of sellerGroups) {
        await kafkaClient.publishNotificationEvent('new_order', {
          recipientId: group.sellerId,
          recipientType: 'seller',
          orderId: order.id,
          orderNumber: order.orderNumber,
          template: 'new_order_seller',
          data: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            items: group.items,
            totalAmount: group.totalAmount
          }
        });
      }

    } catch (error) {
      logger.error('Error sending order notifications:', error);
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId, customerId = null) {
    try {
      const query = { _id: orderId };
      if (customerId) {
        query.customerId = customerId;
      }

      const order = await Order.findOne(query);
      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      logger.error('Error fetching order:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, customerId, reason = '') {
    try {
      const order = await Order.findOne({ _id: orderId, customerId });
      if (!order) {
        throw new Error('Order not found');
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new Error('Order cannot be cancelled in current status');
      }

      // Release inventory reservations
      for (const item of order.items) {
        const inventory = await Inventory.findOne({ productId: item.productId });
        if (inventory) {
          await inventory.releaseReservation(orderId, `Order cancelled: ${reason}`);
        }
      }

      // Cancel order
      await order.cancelOrder(reason);

      // Publish event
      await kafkaClient.publishOrderEvent('order_cancelled', order);

      logger.info(`Order cancelled: ${order.orderNumber}`);
      return order;

    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Get cart for customer
   */
  async getCart(customerId) {
    try {
      let cart = await Cart.findOne({ customerId });
      if (!cart) {
        // Create empty cart if doesn't exist
        cart = new Cart({ 
          customerId, 
          items: [],
          totalItems: 0,
          totalAmount: 0
        });
        await cart.save();
      }
      return cart;
    } catch (error) {
      logger.error('Error fetching cart:', error);
      throw error;
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(customerId, productId, quantity) {
    try {
      const cart = await Cart.findOne({ customerId });
      if (!cart) {
        throw new Error('Cart not found');
      }

      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        await cart.removeItem(productId);
      } else {
        // Check inventory availability
        const inventoryCheck = await serviceClient.checkInventory([{
          productId,
          quantity
        }]);
        
        if (!inventoryCheck.allAvailable) {
          const item = inventoryCheck.items[0];
          throw new Error(`Insufficient stock. Available: ${item.availableStock}, Requested: ${quantity}`);
        }

        // Update quantity
        await cart.updateItemQuantity(productId, quantity);
      }

      logger.info(`Cart item updated: ${customerId} - ${productId} - Qty: ${quantity}`);
      return cart;
    } catch (error) {
      logger.error('Error updating cart item:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(customerId, productId) {
    try {
      const cart = await Cart.findOne({ customerId });
      if (!cart) {
        throw new Error('Cart not found');
      }

      await cart.removeItem(productId);
      
      logger.info(`Item removed from cart: ${customerId} - ${productId}`);
      return cart;
    } catch (error) {
      logger.error('Error removing item from cart:', error);
      throw error;
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(customerId) {
    try {
      const cart = await Cart.findOne({ customerId });
      if (!cart) {
        throw new Error('Cart not found');
      }

      await cart.clearCart();
      
      logger.info(`Cart cleared: ${customerId}`);
      return cart;
    } catch (error) {
      logger.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(customerId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const query = { customerId };
      
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await Order.countDocuments(query);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching customer orders:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId, customerId = null) {
    try {
      const query = { _id: orderId };
      if (customerId) {
        query.customerId = customerId;
      }

      const order = await Order.findOne(query);
      return order;
    } catch (error) {
      logger.error('Error fetching order by ID:', error);
      throw error;
    }
  }

  /**
   * Update order status (admin function)
   */
  async updateOrderStatus(orderId, status, notes = '') {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      order.status = status;
      if (notes) {
        order.notes = notes;
      }
      
      await order.save();

      logger.info(`Order status updated: ${order.orderNumber} - ${status}`);
      return order;
    } catch (error) {
      logger.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Get all orders (admin function)
   */
  async getAllOrders(options = {}) {
    try {
      const { page = 1, limit = 20, status, sellerId } = options;
      const query = {};
      
      if (status) {
        query.status = status;
      }
      
      if (sellerId) {
        query['items.sellerId'] = sellerId;
      }

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await Order.countDocuments(query);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching all orders:', error);
      throw error;
    }
  }

  /**
   * Check inventory availability
   */
  async checkInventoryAvailability(items) {
    try {
      return await serviceClient.checkInventory(items);
    } catch (error) {
      logger.error('Error checking inventory:', error);
      throw error;
    }
  }

  /**
   * Reserve inventory
   */
  async reserveInventory(orderId, items, expirationMinutes) {
    try {
      return await serviceClient.reserveInventory(orderId, items, expirationMinutes);
    } catch (error) {
      logger.error('Error reserving inventory:', error);
      throw error;
    }
  }

  /**
   * Release inventory
   */
  async releaseInventory(orderId) {
    try {
      return await serviceClient.releaseInventory(orderId, 'Manual release');
    } catch (error) {
      logger.error('Error releasing inventory:', error);
      throw error;
    }
  }
}

module.exports = new OrderService();