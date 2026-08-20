'use strict';

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 12;

/**
 * Strips the password hash before sending user data in a response.
 * Never expose password hashes to clients.
 */
const sanitizeUser = (user) => {
  const { password, ...safe } = user.toJSON ? user.toJSON() : user;
  return safe;
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
/**
 * Create a new user account.
 * Only accessible to Admin (enforced at the route level).
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check for duplicate email before hashing (cheap check first)
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        status: 409,
        message: 'An account with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'cashier',
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
/**
 * Authenticate a user and return a JWT.
 * Intentionally uses a generic error message to avoid user enumeration.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    // Generic message — do not reveal whether email exists
    if (!user) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid email or password.',
      });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
/**
 * Return the currently authenticated user's profile.
 * Requires: authenticate middleware.
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is already set and verified by authenticate middleware.
    // Re-fetch to get the freshest data.
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
