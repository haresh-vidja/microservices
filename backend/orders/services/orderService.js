/**
 * Order Service Layer
 * Contains business logic for order operations
 */

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Inventory = require('../models/Inventory');
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
      
      // Check availability
      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
      }

      // Get or create cart
      let cart = await Cart.findOne({ customerId });
      if (!cart) {
        cart = new Cart({ customerId, items: [] });
      }

      // Add item to cart
      await cart.addItem({
        productId,
        sellerId: product.sellerId,
        quantity,
        price: product.price,
        productName: product.name,
        productImage: product.images?.[0]?.url,
        availableStock: product.stock
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

      // Validate stock availability and reserve items
      const orderItems = [];
      for (const cartItem of cart.items) {
        let inventory = await Inventory.findOne({ productId: cartItem.productId });
        
        if (!inventory) {
          // Create inventory record if doesn't exist
          const product = await serviceClient.getProduct(cartItem.productId);
          inventory = new Inventory({
            productId: cartItem.productId,
            sellerId: cartItem.sellerId,
            totalStock: product.stock || 0
          });
          await inventory.save();
        }

        // Reserve stock
        await inventory.reserveStock(
          'temp-order-id', // Will be updated with actual order ID
          cartItem.quantity
        );

        orderItems.push({
          productId: cartItem.productId,
          sellerId: cartItem.sellerId,
          productName: cartItem.productName,
          productImage: cartItem.productImage,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
          totalPrice: cartItem.price * cartItem.quantity
        });
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

      // Update reservations with actual order ID
      for (const item of orderItems) {
        const inventory = await Inventory.findOne({ productId: item.productId });
        const reservation = inventory.reservations.find(r => 
          r.orderId === 'temp-order-id' && r.status === 'active'
        );
        if (reservation) {
          reservation.orderId = order.id;
        }
        await inventory.save();
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
}

module.exports = new OrderService();