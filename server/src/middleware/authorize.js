'use strict';

/**
 * Role-based authorization middleware factory.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, authorize('admin'), handler)
 *   router.get('/staff',      authenticate, authorize('admin', 'inventory_manager'), handler)
 *
 * Must always be used AFTER the authenticate middleware.
 *
 * @param  {...string} roles  One or more allowed roles
 * @returns {Function}        Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // Should not reach here without authenticate running first
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: `Access denied. Requires one of: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

module.exports = authorize;
