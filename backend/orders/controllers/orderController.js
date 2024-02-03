/**
 * Order Controller
 * Handles HTTP requests for order management
 */

const orderService = require('../services/orderService');
const { sendSuccess, sendError } = require('../utils/response');

class OrderController {
    
    // Cart Management
    async addToCart(req, res) {
        try {
            const { productId, quantity } = req.body;
            const customerId = req.user.id;

            const result = await orderService.addToCart(customerId, productId, quantity);
            return sendSuccess(res, 'Item added to cart', result);
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    }

    async getCart(req, res) {
        try {
            const customerId = req.user.id;
            const cart = await orderService.getCart(customerId);
            return sendSuccess(res, 'Cart retrieved successfully', cart);
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async updateCartItem(req, res) {
        try {
            const { productId, quantity } = req.body;
            const customerId = req.user.id;

            const result = await orderService.updateCartItem(customerId, productId, quantity);
            return sendSuccess(res, 'Cart item updated', result);
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    }

    async removeFromCart(req, res) {
        try {
            const { productId } = req.body;
            const customerId = req.user.id;

            await orderService.removeFromCart(customerId, productId);
            return sendSuccess(res, 'Item removed from cart');
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    }

    async clearCart(req, res) {
        try {
            const customerId = req.user.id;
            await orderService.clearCart(customerId);
            return sendSuccess(res, 'Cart cleared');
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    // Order Management
    async placeOrder(req, res) {
        try {
            const { shippingAddress, paymentMethod, notes } = req.body;
            const customerId = req.user.id;

            const order = await orderService.placeOrder(customerId, {
                shippingAddress,
                paymentMethod: paymentMethod || 'COD',
                notes
            });
            
            return sendSuccess(res, 'Order placed successfully', order, 201);
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    }

    async getCustomerOrders(req, res) {
        try {
            const customerId = req.user.id;
            const { page = 1, limit = 10, status } = req.query;

            const orders = await orderService.getCustomerOrders(customerId, {
                page: parseInt(page),
                limit: parseInt(limit),
                status
            });
            
            return sendSuccess(res, 'Orders retrieved successfully', orders);
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const customerId = req.user.id;

            const order = await orderService.getOrderById(id, customerId);
            
            if (!order) {
                return sendError(res, 'Order not found', 404);
            }
            
            return sendSuccess(res, 'Order retrieved successfully', order);
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async cancelOrder(req, res) {
        try {
            const { id } = req.params;
            const customerId = req.user.id;

            const order = await orderService.cancelOrder(id, customerId);
            return sendSuccess(res, 'Order cancelled successfully', order);
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    }

    // Admin APIs
    async getAllOrders(req, res) {
        try {
            const { page = 1, limit = 20, status, sellerId } = req.query;

            const orders = await orderService.getAllOrders({
                page: parseInt(page),
                limit: parseInt(limit),
                status,
                sellerId
            });
            
            return sendSuccess(res, 'Orders retrieved successfully', orders);
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            const order = await orderService.updateOrderStatus(id, status, notes);
            return sendSuccess(res, 'Order status updated', order);
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    }

    // Inventory APIs
    async checkInventoryAvailability(req, res) {
        try {
            const { items } = req.body; // [{ productId, quantity }]

            const availability = await orderService.checkInventoryAvailability(items);
            return sendSuccess(res, 'Inventory availability checked', availability);
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async reserveInventory(req, res) {
        try {
            const { orderId, items, expirationMinutes = 30 } = req.body;

            const reservation = await orderService.reserveInventory(orderId, items, expirationMinutes);
            return sendSuccess(res, 'Inventory reserved', reservation);
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    }

    async releaseInventory(req, res) {
        try {
            const { orderId } = req.body;

            await orderService.releaseInventory(orderId);
            return sendSuccess(res, 'Inventory released');
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    }
}

module.exports = new OrderController();