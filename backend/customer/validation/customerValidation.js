/**
 * Customer Validation Schemas
 * Using Joi for request validation
 */

const Joi = require('joi');

/**
 * Customer validation schemas
 */
const customerSchemas = {
  // Sign up validation
  signUp: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    
    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Last name is required',
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
      }),
    
    password: Joi.string()
      .min(6)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password cannot exceed 50 characters'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Please confirm your password'
      }),
    
    phone: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    dateOfBirth: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': 'Date of birth cannot be in the future'
      }),
    
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .optional()
      .messages({
        'any.only': 'Gender must be male, female, or other'
      })
  }),

  // Sign in validation
  signIn: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  }),

  // Update profile validation
  updateProfile: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .optional(),
    
    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .optional(),
    
    phone: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .optional(),
    
    dateOfBirth: Joi.date()
      .max('now')
      .optional(),
    
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .optional(),
    
    profileImage: Joi.string()
      .uri()
      .optional()
  }),

  // Change password validation
  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'string.empty': 'Current password is required'
      }),
    
    newPassword: Joi.string()
      .min(6)
      .max(50)
      .required()
      .messages({
        'string.empty': 'New password is required',
        'string.min': 'New password must be at least 6 characters',
        'string.max': 'New password cannot exceed 50 characters'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Please confirm your new password'
      })
  }),

  // Refresh token validation
  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'string.empty': 'Refresh token is required'
      })
  }),

  // Query parameters validation
  queryParams: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .default(1),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(10),
    
    sort: Joi.string()
      .optional()
      .default('-createdAt'),
    
    isActive: Joi.boolean()
      .optional(),
    
    isVerified: Joi.boolean()
      .optional(),
    
    search: Joi.string()
      .optional()
      .trim()
      .min(1),
    
    status: Joi.string()
      .valid('active', 'inactive', 'all')
      .optional()
  })
};

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
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

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Query validation middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateQuery = (req, res, next) => {
  const { error, value } = customerSchemas.queryParams.validate(req.query, {
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
      message: 'Invalid query parameters',
      errors
    });
  }

  req.query = value;
  next();
};

module.exports = {
  schemas: customerSchemas,
  validate,
  validateQuery
};