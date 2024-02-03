/**
 * Customer Routes
 * Defines all customer-related API endpoints
 */

const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');
const { verifyToken, verifyServiceKey } = require('../middleware/auth');
const { validate, validateQuery, schemas } = require('../validation/customerValidation');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /customers/signup:
 *   post:
 *     summary: Register a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer registered successfully
 */
router.post('/signup', 
  validate(schemas.signUp),
  asyncHandler(async (req, res) => {
    const result = await customerService.signUp(req.body);
    sendSuccess(res, result, 'Customer registered successfully', 201);
  })
);

/**
 * @swagger
 * /customers/signin:
 *   post:
 *     summary: Authenticate customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/signin',
  validate(schemas.signIn),
  asyncHandler(async (req, res) => {
    const result = await customerService.signIn(req.body);
    sendSuccess(res, result, 'Login successful');
  })
);

/**
 * @swagger
 * /customers/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/refresh-token',
  validate(schemas.refreshToken),
  asyncHandler(async (req, res) => {
    const result = await customerService.refreshToken(req.body.refreshToken);
    sendSuccess(res, result, 'Token refreshed successfully');
  })
);

// Protected routes (require authentication)

/**
 * @swagger
 * /customers/profile:
 *   get:
 *     summary: Get current customer profile
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile',
  verifyToken,
  asyncHandler(async (req, res) => {
    const result = await customerService.getProfile(req.customer.id);
    sendSuccess(res, result, 'Profile retrieved successfully');
  })
);

/**
 * @swagger
 * /customers/profile/{id}:
 *   get:
 *     summary: Get customer profile by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile/:id',
  verifyToken,
  asyncHandler(async (req, res) => {
    const result = await customerService.getProfile(req.params.id);
    sendSuccess(res, result, 'Profile retrieved successfully');
  })
);

/**
 * @swagger
 * /customers/profile:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile',
  verifyToken,
  validate(schemas.updateProfile),
  asyncHandler(async (req, res) => {
    const result = await customerService.updateProfile(req.customer.id, req.body);
    sendSuccess(res, result, 'Profile updated successfully');
  })
);

/**
 * @swagger
 * /customers/change-password:
 *   put:
 *     summary: Change customer password
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.put('/change-password',
  verifyToken,
  validate(schemas.changePassword),
  asyncHandler(async (req, res) => {
    const result = await customerService.changePassword(req.customer.id, req.body);
    sendSuccess(res, result, 'Password changed successfully');
  })
);

/**
 * @swagger
 * /customers/account:
 *   delete:
 *     summary: Delete customer account
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete('/account',
  verifyToken,
  asyncHandler(async (req, res) => {
    const result = await customerService.deleteAccount(req.customer.id);
    sendSuccess(res, result, 'Account deleted successfully');
  })
);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 */
router.get('/',
  verifyToken,
  validateQuery,
  asyncHandler(async (req, res) => {
    const result = await customerService.getAllCustomers(req.query);
    sendSuccess(res, result, 'Customers retrieved successfully');
  })
);

// Inter-service communication endpoints

/**
 * @swagger
 * /customers/service/bulk:
 *   post:
 *     summary: Get multiple customers by IDs (Service only)
 *     tags: [Inter-Service]
 *     security:
 *       - serviceKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 */
router.post('/service/bulk',
  verifyServiceKey,
  asyncHandler(async (req, res) => {
    const { customerIds } = req.body;
    
    if (!customerIds || !Array.isArray(customerIds)) {
      return sendError(res, 'customerIds array is required', 400);
    }
    
    const customers = await customerService.getCustomersByIds(customerIds);
    sendSuccess(res, 'Customers retrieved successfully', customers);
  })
);

/**
 * @swagger
 * /customers/service/verify:
 *   post:
 *     summary: Verify customer exists and is active (Service only)
 *     tags: [Inter-Service]
 *     security:
 *       - serviceKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer verification result
 */
router.post('/service/verify',
  verifyServiceKey,
  asyncHandler(async (req, res) => {
    const { customerId } = req.body;
    
    if (!customerId) {
      return sendError(res, 'customerId is required', 400);
    }
    
    const isValid = await customerService.verifyCustomer(customerId);
    sendSuccess(res, 'Customer verified', { 
      customerId, 
      isValid, 
      timestamp: new Date().toISOString() 
    });
  })
);

module.exports = router;