'use strict';

const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const ROLES = ['admin', 'inventory_manager', 'cashier'];

/**
 * Validation for creating a user
 */
const validateCreateUser = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),

  body('role')
    .optional()
    .isIn(ROLES)
    .withMessage(
      'Role must be admin, inventory_manager, or cashier'
    ),

  handleValidationErrors,
];

/**
 * Validation for updating a user
 */
const validateUpdateUser = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  body('role')
    .optional()
    .isIn(ROLES)
    .withMessage(
      'Role must be admin, inventory_manager, or cashier'
    ),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false'),

  handleValidationErrors,
];

/**
 * Validation for changing password
 */
const validateChangePassword = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),

  handleValidationErrors,
];

/**
 * Validation for user ID
 */
const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer'),

  handleValidationErrors,
];

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateChangePassword,
  validateUserId,
};