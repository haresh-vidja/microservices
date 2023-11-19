/**
 * Address Routes
 * Defines all address-related API endpoints
 */

const express = require('express');
const router = express.Router();
const addressService = require('../services/addressService');
const { verifyToken } = require('../middleware/auth');
const { validate, schemas } = require('../validation/addressValidation');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');

// All address routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *         - addressLine1
 *         - city
 *         - state
 *         - country
 *         - postalCode
 *       properties:
 *         type:
 *           type: string
 *           enum: [home, work, other]
 *           default: home
 *         addressLine1:
 *           type: string
 *           maxLength: 100
 *         addressLine2:
 *           type: string
 *           maxLength: 100
 *         city:
 *           type: string
 *           maxLength: 50
 *         state:
 *           type: string
 *           maxLength: 50
 *         country:
 *           type: string
 *           maxLength: 50
 *         postalCode:
 *           type: string
 *           pattern: '^[A-Za-z0-9\\s-]{3,10}$'
 *         contactName:
 *           type: string
 *           maxLength: 100
 *         contactPhone:
 *           type: string
 *           pattern: '^[0-9]{10,15}$'
 *         landmark:
 *           type: string
 *           maxLength: 100
 *         deliveryInstructions:
 *           type: string
 *           maxLength: 500
 *         isDefault:
 *           type: boolean
 *         coordinates:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               minimum: -90
 *               maximum: 90
 *             longitude:
 *               type: number
 *               minimum: -180
 *               maximum: 180
 */

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Address created successfully
 */
router.post('/',
  validate(schemas.create),
  asyncHandler(async (req, res) => {
    const result = await addressService.createAddress(req.customer.id, req.body);
    sendSuccess(res, result, 'Address created successfully', 201);
  })
);

/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: Get all addresses for current customer
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const result = await addressService.getAddresses(req.customer.id);
    sendSuccess(res, result, 'Addresses retrieved successfully');
  })
);

/**
 * @swagger
 * /addresses/{id}:
 *   get:
 *     summary: Get a specific address
 *     tags: [Addresses]
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
 *         description: Address retrieved successfully
 */
router.get('/:id',
  asyncHandler(async (req, res) => {
    const result = await addressService.getAddress(req.params.id, req.customer.id);
    sendSuccess(res, result, 'Address retrieved successfully');
  })
);

/**
 * @swagger
 * /addresses/{id}:
 *   put:
 *     summary: Update an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address updated successfully
 */
router.put('/:id',
  validate(schemas.update),
  asyncHandler(async (req, res) => {
    const result = await addressService.updateAddress(req.params.id, req.customer.id, req.body);
    sendSuccess(res, result, 'Address updated successfully');
  })
);

/**
 * @swagger
 * /addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Addresses]
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
 *         description: Address deleted successfully
 */
router.delete('/:id',
  asyncHandler(async (req, res) => {
    const result = await addressService.deleteAddress(req.params.id, req.customer.id);
    sendSuccess(res, result, 'Address deleted successfully');
  })
);

/**
 * @swagger
 * /addresses/{id}/default:
 *   put:
 *     summary: Set an address as default
 *     tags: [Addresses]
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
 *         description: Default address set successfully
 */
router.put('/:id/default',
  asyncHandler(async (req, res) => {
    const result = await addressService.setDefaultAddress(req.params.id, req.customer.id);
    sendSuccess(res, result, 'Default address set successfully');
  })
);

module.exports = router;