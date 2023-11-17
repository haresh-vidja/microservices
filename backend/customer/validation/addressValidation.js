/**
 * Address Validation Schemas
 * Using Joi for request validation
 */

const Joi = require('joi');

/**
 * Address validation schemas
 */
const addressSchemas = {
  // Create address validation
  create: Joi.object({
    type: Joi.string()
      .valid('home', 'work', 'other')
      .optional()
      .default('home'),
    
    addressLine1: Joi.string()
      .trim()
      .max(100)
      .required()
      .messages({
        'string.empty': 'Address line 1 is required',
        'string.max': 'Address line 1 cannot exceed 100 characters'
      }),
    
    addressLine2: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow(''),
    
    city: Joi.string()
      .trim()
      .max(50)
      .required()
      .messages({
        'string.empty': 'City is required',
        'string.max': 'City cannot exceed 50 characters'
      }),
    
    state: Joi.string()
      .trim()
      .max(50)
      .required()
      .messages({
        'string.empty': 'State is required',
        'string.max': 'State cannot exceed 50 characters'
      }),
    
    country: Joi.string()
      .trim()
      .max(50)
      .required()
      .messages({
        'string.empty': 'Country is required',
        'string.max': 'Country cannot exceed 50 characters'
      }),
    
    postalCode: Joi.string()
      .trim()
      .pattern(/^[A-Za-z0-9\s-]{3,10}$/)
      .required()
      .messages({
        'string.empty': 'Postal code is required',
        'string.pattern.base': 'Please provide a valid postal code'
      }),
    
    contactName: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow(''),
    
    contactPhone: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    landmark: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow(''),
    
    deliveryInstructions: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Delivery instructions cannot exceed 500 characters'
      }),
    
    isDefault: Joi.boolean()
      .optional(),
    
    coordinates: Joi.object({
      latitude: Joi.number()
        .min(-90)
        .max(90)
        .optional(),
      longitude: Joi.number()
        .min(-180)
        .max(180)
        .optional()
    }).optional()
  }),

  // Update address validation
  update: Joi.object({
    type: Joi.string()
      .valid('home', 'work', 'other')
      .optional(),
    
    addressLine1: Joi.string()
      .trim()
      .max(100)
      .optional(),
    
    addressLine2: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow(''),
    
    city: Joi.string()
      .trim()
      .max(50)
      .optional(),
    
    state: Joi.string()
      .trim()
      .max(50)
      .optional(),
    
    country: Joi.string()
      .trim()
      .max(50)
      .optional(),
    
    postalCode: Joi.string()
      .trim()
      .pattern(/^[A-Za-z0-9\s-]{3,10}$/)
      .optional(),
    
    contactName: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow(''),
    
    contactPhone: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .optional()
      .allow(''),
    
    landmark: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow(''),
    
    deliveryInstructions: Joi.string()
      .max(500)
      .optional()
      .allow(''),
    
    isDefault: Joi.boolean()
      .optional(),
    
    coordinates: Joi.object({
      latitude: Joi.number()
        .min(-90)
        .max(90)
        .optional(),
      longitude: Joi.number()
        .min(-180)
        .max(180)
        .optional()
    }).optional()
  })
};

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateAddress = (schema) => {
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

module.exports = {
  schemas: addressSchemas,
  validate: validateAddress
};