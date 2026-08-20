'use strict';

const { Router } = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deactivateUser,
} = require('../controllers/userController');

const {
  validateCreateUser,
  validateUpdateUser,
  validateChangePassword,
  validateUserId,
} = require('../validators/userValidators');

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/users
// List all users
// Admin only
// ─────────────────────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  authorize('admin'),
  getUsers
);

// ─────────────────────────────────────────────────────────────
// POST /api/users
// Create a new user
// Admin only
// ─────────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateCreateUser,
  createUser
);

// ─────────────────────────────────────────────────────────────
// GET /api/users/:id
// Get one user
// Admin only
// ─────────────────────────────────────────────────────────────
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  validateUserId,
  getUserById
);

// ─────────────────────────────────────────────────────────────
// PUT /api/users/:id
// Update user information
// Admin only
// ─────────────────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateUpdateUser,
  updateUser
);

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/:id/password
// Change user password
// Admin only
// ─────────────────────────────────────────────────────────────
router.patch(
  '/:id/password',
  authenticate,
  authorize('admin'),
  validateChangePassword,
  changePassword
);

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/:id/deactivate
// Deactivate user
// Admin only
// ─────────────────────────────────────────────────────────────
router.patch(
  '/:id/deactivate',
  authenticate,
  authorize('admin'),
  validateUserId,
  deactivateUser
);

module.exports = router;