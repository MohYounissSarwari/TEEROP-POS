'use strict';

const { body } = require('express-validator');
const { handleValidationErrors } = require('./index');

/**
 * Validation chain for POST /api/auth/register
 * Only Admin can call this route, but we still validate the body strictly.
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(['admin', 'inventory_manager', 'cashier'])
    .withMessage('Role must be admin, inventory_manager, or cashier'),

  handleValidationErrors,
];

/**
 * Validation chain for POST /api/auth/login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

module.exports = { validateRegister, validateLogin };
