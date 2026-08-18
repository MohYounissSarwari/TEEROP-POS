'use strict';

const {
  ValidationError,
  UniqueConstraintError,
  DatabaseError,
} = require('sequelize');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ValidationError) {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Validation failed',
      errors,
    });
  }

  if (err instanceof UniqueConstraintError) {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(409).json({
      success: false,
      status: 409,
      message: 'A record with this value already exists',
      errors,
    });
  }

  if (err instanceof DatabaseError) {
    console.error('[DB Error]', err.message);

    return res.status(500).json({
      success: false,
      status: 500,
      message: 'A database error occurred',
    });
  }

  if (err.status) {
    return res.status(err.status).json({
      success: false,
      status: err.status,
      message: err.message || 'An error occurred',
    });
  }

  console.error('[Unhandled Error]', err);

  const isDev = process.env.NODE_ENV === 'development';

  return res.status(500).json({
    success: false,
    status: 500,
    message: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;