/**
 * Seller Routes
 * Defines all seller-related API endpoints
 */

const express = require('express');
const router = express.Router();
const sellerService = require('../services/sellerService');
const { verifyToken, checkRoleAccess, verifyServiceKey } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/response');
const Joi = require('joi');

/**
 * Validation schemas
 */
const sellerSchemas = {
  signUp: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().min(6).max(50).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    businessName: Joi.string().trim().max(100).required(),
    businessType: Joi.string().valid('individual', 'partnership', 'llc', 'corporation', 'other').optional(),
    businessDescription: Joi.string().max(500).optional(),
    address: Joi.object({
      street: Joi.string().trim().max(100).required(),
      city: Joi.string().trim().max(50).required(),
      state: Joi.string().trim().max(50).required(),
      country: Joi.string().trim().max(50).required(),
      postalCode: Joi.string().trim().pattern(/^[A-Za-z0-9\s-]{3,10}$/).required()
    }).required()
  }),
  
  signIn: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required()
  }),
  
  create: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().min(6).max(50).required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    businessName: Joi.string().trim().max(100).optional(),
    roleId: Joi.string().optional()
  }),
  
  updateProfile: Joi.object({
    // Seller personal data
    firstName: Joi.string().trim().min(2).max(50).optional(),
    lastName: Joi.string().trim().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    profileImage: Joi.string().optional(),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    
    // Business data
    businessName: Joi.string().trim().max(100).optional(),
    businessType: Joi.string().valid('individual', 'partnership', 'llc', 'corporation', 'other').optional(),
    description: Joi.string().max(1000).optional(),
    logoMediaId: Joi.string().optional(),
    website: Joi.string().uri().optional(),
    industry: Joi.string().trim().max(100).optional(),
    categories: Joi.array().items(Joi.string()).optional(),
    establishedDate: Joi.date().optional(),
    employeeCount: Joi.number().min(1).optional(),
    
    // Business address
    address: Joi.object({
      street: Joi.string().trim().max(100).required(),
      street2: Joi.string().trim().max(100).optional(),
      city: Joi.string().trim().max(50).required(),
      state: Joi.string().trim().max(50).required(),
      country: Joi.string().trim().max(50).required(),
      postalCode: Joi.string().trim().pattern(/^[A-Za-z0-9\s-]{3,10}$/).required()
    }).optional()
  })
};

/**
 * Validation middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    req.body = value;
    next();
  };
};

// Public routes

/**
 * @swagger
 * /sellers/signup:
 *   post:
 *     summary: Register a new seller
 *     tags: [Sellers]
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
 *               - phone
 *               - businessName
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               businessName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Seller registered successfully
 */
router.post('/signup',
  validate(sellerSchemas.signUp),
  asyncHandler(async (req, res) => {
    const result = await sellerService.signUp(req.body);
    sendSuccess(res, result, 'Seller registered successfully', 201);
  })
);

/**
 * @swagger
 * /sellers/signin:
 *   post:
 *     summary: Authenticate seller
 *     tags: [Sellers]
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
  validate(sellerSchemas.signIn),
  asyncHandler(async (req, res) => {
    const result = await sellerService.signIn(req.body);
    sendSuccess(res, result, 'Login successful');
  })
);

// Protected routes

/**
 * @swagger
 * /sellers/create:
 *   post:
 *     summary: Create a new seller (Admin only)
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
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
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Seller created successfully
 */
router.post('/create',
  verifyToken,
  checkRoleAccess('add-user'),
  validate(sellerSchemas.create),
  asyncHandler(async (req, res) => {
    const result = await sellerService.create(req.body, req.seller);
    sendSuccess(res, result, 'Seller created successfully', 201);
  })
);

/**
 * @swagger
 * /sellers/list:
 *   get:
 *     summary: Get list of sellers
 *     tags: [Sellers]
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
 *     responses:
 *       200:
 *         description: Sellers retrieved successfully
 */
router.get('/list',
  verifyToken,
  checkRoleAccess('manage-user'),
  asyncHandler(async (req, res) => {
    const result = await sellerService.getSellerList(req.query, req.seller);
    sendSuccess(res, result, 'Sellers retrieved successfully');
  })
);

/**
 * @swagger
 * /sellers/profile/{id}:
 *   get:
 *     summary: Get seller profile by ID
 *     tags: [Sellers]
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
  checkRoleAccess('view-user'),
  asyncHandler(async (req, res) => {
    const result = await sellerService.getProfile(req.params.id);
    sendSuccess(res, result, 'Profile retrieved successfully');
  })
);

/**
 * @swagger
 * /sellers/profile:
 *   get:
 *     summary: Get current seller profile
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile',
  verifyToken,
  asyncHandler(async (req, res) => {
    const result = await sellerService.getProfile(req.seller.id);
    sendSuccess(res, result, 'Profile retrieved successfully');
  })
);

/**
 * @swagger
 * /sellers/profile:
 *   put:
 *     summary: Update seller profile
 *     tags: [Sellers]
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile',
  verifyToken,
  validate(sellerSchemas.updateProfile),
  asyncHandler(async (req, res) => {
    const result = await sellerService.updateProfile(req.seller.id, req.body);
    sendSuccess(res, result, 'Profile updated successfully');
  })
);

// Inter-service communication endpoints

/**
 * @swagger
 * /sellers/service/bulk:
 *   post:
 *     summary: Get multiple sellers by IDs (Service only)
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
 *               sellerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Sellers retrieved successfully
 */
router.post('/service/bulk',
  verifyServiceKey,
  asyncHandler(async (req, res) => {
    const { sellerIds } = req.body;
    
    if (!sellerIds || !Array.isArray(sellerIds)) {
      return sendError(res, 'sellerIds array is required', 400);
    }
    
    const sellers = await sellerService.getSellersByIds(sellerIds);
    sendSuccess(res, 'Sellers retrieved successfully', sellers);
  })
);

/**
 * @swagger
 * /sellers/service/verify:
 *   post:
 *     summary: Verify seller exists and is active (Service only)
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
 *               sellerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seller verification result
 */
router.post('/service/verify',
  verifyServiceKey,
  asyncHandler(async (req, res) => {
    const { sellerId } = req.body;
    
    if (!sellerId) {
      return sendError(res, 'sellerId is required', 400);
    }
    
    const isValid = await sellerService.verifySeller(sellerId);
    sendSuccess(res, 'Seller verified', { 
      sellerId, 
      isValid, 
      timestamp: new Date().toISOString() 
    });
  })
);

module.exports = router;