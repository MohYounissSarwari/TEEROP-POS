'use strict';

const { Router } = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const {
  getDashboardStatistics,
  getSalesStatistics,
  getInventoryStatistics,
} = require('../controllers/statisticsController');

const router = Router();

/**
 * GET /api/statistics/dashboard
 * Admin and inventory_manager
 */
router.get(
  '/dashboard',
  authenticate,
  authorize('admin', 'inventory_manager'),
  getDashboardStatistics
);

/**
 * GET /api/statistics/sales
 * Admin only
 */
router.get(
  '/sales',
  authenticate,
  authorize('admin'),
  getSalesStatistics
);

/**
 * GET /api/statistics/inventory
 * Inventory manager and admin
 */
router.get(
  '/inventory',
  authenticate,
  authorize('inventory_manager', 'admin'),
  getInventoryStatistics
);

module.exports = router;
