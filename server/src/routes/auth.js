'use strict';

const { Router } = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidators');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = Router();

/**
 * POST /api/auth/login
 * Public — no authentication required.
 */
router.post('/login', validateLogin, login);

/**
 * POST /api/auth/register
 * Protected — only Admin can create new user accounts.
 * Per spec: "User registration/creation through authorized Admin functionality"
 */
router.post('/register', authenticate, authorize('admin'), validateRegister, register);

/**
 * GET /api/auth/me
 * Protected — any authenticated user can view their own profile.
 */
router.get('/me', authenticate, getMe);

module.exports = router;
