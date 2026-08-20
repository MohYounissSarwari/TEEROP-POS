'use strict';

const { body } = require('express-validator');
const { handleValidationErrors } = require('./index');

const categories = ['Fragile', 'Cold', 'Tech', 'Cleaning', 'General'];

/**
 * Validation for creating a product
 */
const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 255 })
    .withMessage('Name must not exceed 255 characters'),

  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ max: 100 })
    .withMessage('SKU must not exceed 100 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(categories)
    .withMessage(
      'Category must be Fragile, Cold, Tech, Cleaning, or General'
    ),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a number greater than or equal to 0'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be an integer greater than or equal to 0'),

  body('reorderThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage(
      'Reorder threshold must be an integer greater than or equal to 0'
    ),

  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),

  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Serial number must not exceed 100 characters'),

  body('isFragile')
    .optional()
    .isBoolean()
    .withMessage('isFragile must be true or false'),

  body('handlingNote')
    .optional()
    .trim(),

  body('storageTemp')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Storage temperature must not exceed 50 characters'),

  body('warrantyPeriod')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Warranty period must not exceed 100 characters'),

  body('isHazardous')
    .optional()
    .isBoolean()
    .withMessage('isHazardous must be true or false'),

  body('safetyNote')
    .optional()
    .trim(),

  body('imageUrl')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image URL must not exceed 500 characters'),

  body('description')
    .optional()
    .trim(),

  handleValidationErrors,
];

/**
 * Validation for updating a product
 */
const validateUpdateProduct = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Name must not exceed 255 characters'),

  body('sku')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('SKU cannot be empty')
    .isLength({ max: 100 })
    .withMessage('SKU must not exceed 100 characters'),

  body('category')
    .optional()
    .isIn(categories)
    .withMessage(
      'Category must be Fragile, Cold, Tech, Cleaning, or General'
    ),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a number greater than or equal to 0'),

  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be an integer greater than or equal to 0'),

  body('reorderThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage(
      'Reorder threshold must be an integer greater than or equal to 0'
    ),

  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),

  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Serial number must not exceed 100 characters'),

  body('isFragile')
    .optional()
    .isBoolean()
    .withMessage('isFragile must be true or false'),

  body('isHazardous')
    .optional()
    .isBoolean()
    .withMessage('isHazardous must be true or false'),

  body('storageTemp')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Storage temperature must not exceed 50 characters'),

  body('warrantyPeriod')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Warranty period must not exceed 100 characters'),

  body('imageUrl')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image URL must not exceed 500 characters'),

  body('description')
    .optional()
    .trim(),

  body('handlingNote')
    .optional()
    .trim(),

  body('safetyNote')
    .optional()
    .trim(),

  handleValidationErrors,
];

/**
 * Validation for restocking a product
 */
const validateRestock = [
  body('amount')
    .notEmpty()
    .withMessage('Restock amount is required')
    .isInt({ min: 1 })
    .withMessage('Restock amount must be an integer greater than or equal to 1'),

  handleValidationErrors,
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateRestock,
};