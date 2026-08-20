
'use strict';

/**
 * Shared validation utilities.
 * Reads express-validator results and short-circuits with 400 if invalid.
 * Individual validator chains live in separate files (e.g. authValidators.js).
 */

const { validationResult } = require('express-validator');

/**
 * Middleware: reads express-validator result and returns 400 if errors exist.
 * Add this as the LAST item in any validation chain array on a route.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = { handleValidationErrors };
