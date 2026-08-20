'use strict';

const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

/**
 * JWT authentication middleware.
 *
 * Expects:  Authorization: Bearer <token>
 *
 * On success: attaches req.user = { id, email, role, name, isActive }
 * On failure: 401 Unauthorized
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Authentication required. Provide a Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      const isExpired = err.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        status: 401,
        message: isExpired ? 'Token has expired. Please log in again.' : 'Invalid token.',
      });
    }

    // Re-fetch user from DB to catch deactivated accounts or role changes
    const user = await User.findByPk(decoded.sub, {
      attributes: ['id', 'name', 'email', 'role', 'isActive'],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'User no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
