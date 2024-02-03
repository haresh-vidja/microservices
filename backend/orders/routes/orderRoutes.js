/**
 * Order Routes
 * Handles cart management and order placement
 */

const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { verifyServiceKey, verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/v1/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 */
router.post('/cart/add', verifyToken, asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    const customerId = req.user.id;

    const result = await orderService.addToCart(customerId, productId, quantity);
    
    res.json({
        success: true,
        message: 'Item added to cart',
        data: result
    });
}));

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: Get cart items
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.get('/cart', verifyToken, asyncHandler(async (req, res) => {
    const customerId = req.user.id;
    const cart = await orderService.getCart(customerId);
    
    res.json({
        success: true,
        data: cart
    });
}));

/**
 * @swagger
 * /api/v1/cart/update:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.put('/cart/update', verifyToken, asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    const customerId = req.user.id;

    const result = await orderService.updateCartItem(customerId, productId, quantity);
    
    res.json({
        success: true,
        message: 'Cart item updated',
        data: result
    });
}));

/**
 * @swagger
 * /api/v1/cart/remove:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/cart/remove', verifyToken, asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const customerId = req.user.id;

    await orderService.removeFromCart(customerId, productId);
    
    res.json({
        success: true,
        message: 'Item removed from cart'
    });
}));

/**
 * @swagger
 * /api/v1/cart/clear:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/cart/clear', verifyToken, asyncHandler(async (req, res) => {
    const customerId = req.user.id;
    await orderService.clearCart(customerId);
    
    res.json({
        success: true,
        message: 'Cart cleared'
    });
}));

/**
 * @swagger
 * /api/v1/orders/place:
 *   post:
 *     summary: Place new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post('/orders/place', verifyToken, asyncHandler(async (req, res) => {
    const { shippingAddress, paymentMethod, notes } = req.body;
    const customerId = req.user.id;

    const order = await orderService.placeOrder(customerId, {
        shippingAddress,
        paymentMethod: paymentMethod || 'COD',
        notes
    });
    
    res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: order
    });
}));

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get customer orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders', verifyToken, asyncHandler(async (req, res) => {
    const customerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const orders = await orderService.getCustomerOrders(customerId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
    });
    
    res.json({
        success: true,
        data: orders
    });
}));

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders/:id', verifyToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const customerId = req.user.id;

    const order = await orderService.getOrderById(id, customerId);
    
    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }
    
    res.json({
        success: true,
        data: order
    });
}));

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   put:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.put('/orders/:id/cancel', verifyToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const customerId = req.user.id;

    const order = await orderService.cancelOrder(id, customerId);
    
    res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
    });
}));

// Admin/Service APIs with service key authentication

/**
 * @swagger
 * /api/v1/admin/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Admin]
 *     security:
 *       - serviceKey: []
 */
router.get('/admin/orders', verifyServiceKey, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, sellerId } = req.query;

    const orders = await orderService.getAllOrders({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sellerId
    });
    
    res.json({
        success: true,
        data: orders
    });
}));

/**
 * @swagger
 * /api/v1/admin/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - serviceKey: []
 */
router.put('/admin/orders/:id/status', verifyServiceKey, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await orderService.updateOrderStatus(id, status, notes);
    
    res.json({
        success: true,
        message: 'Order status updated',
        data: order
    });
}));

/**
 * @swagger
 * /api/v1/inventory/check:
 *   post:
 *     summary: Check inventory availability
 *     tags: [Inventory]
 *     security:
 *       - serviceKey: []
 */
router.post('/inventory/check', verifyServiceKey, asyncHandler(async (req, res) => {
    const { items } = req.body; // [{ productId, quantity }]

    const availability = await orderService.checkInventoryAvailability(items);
    
    res.json({
        success: true,
        data: availability
    });
}));

/**
 * @swagger
 * /api/v1/inventory/reserve:
 *   post:
 *     summary: Reserve inventory for order
 *     tags: [Inventory]
 *     security:
 *       - serviceKey: []
 */
router.post('/inventory/reserve', verifyServiceKey, asyncHandler(async (req, res) => {
    const { orderId, items, expirationMinutes = 30 } = req.body;

    const reservation = await orderService.reserveInventory(orderId, items, expirationMinutes);
    
    res.json({
        success: true,
        message: 'Inventory reserved',
        data: reservation
    });
}));

/**
 * @swagger
 * /api/v1/inventory/release:
 *   post:
 *     summary: Release reserved inventory
 *     tags: [Inventory]
 *     security:
 *       - serviceKey: []
 */
router.post('/inventory/release', verifyServiceKey, asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    await orderService.releaseInventory(orderId);
    
    res.json({
        success: true,
        message: 'Inventory released'
    });
}));

module.exports = router;