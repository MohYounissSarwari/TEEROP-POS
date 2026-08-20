'use strict';

const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

/**
 * Validation for creating a transaction.
 *
 * Expected body:
 * {
 *   "items": [
 *     {
 *       "productId": 1,
 *       "quantity": 2
 *     }
 *   ]
 * }
 */
const validateCreateTransaction = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),

  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  handleValidationErrors,
];

/**
 * Validation for transaction ID.
 */
const validateTransactionId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Transaction ID must be a valid positive integer'),

  handleValidationErrors,
];

module.exports = {
  validateCreateTransaction,
  validateTransactionId,
};