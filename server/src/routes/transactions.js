'use strict';

const { Router } = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const {
  validateCreateTransaction,
  validateTransactionId,
} = require('../validators/transactionValidators');

const {
  createTransaction,
  getTransactions,
  getTransactionById,
} = require('../controllers/transactionController');

const router = Router();

/**
 * POST /api/transactions
 * Cashier creates a sale.
 */
router.post(
  '/',
  authenticate,
  authorize('cashier'),
  validateCreateTransaction,
  createTransaction
);

/**
 * GET /api/transactions
 * Admin and inventory_manager see all.
 * Cashier sees only their own (filtered in controller).
 */
router.get(
  '/',
  authenticate,
  authorize('admin', 'cashier', 'inventory_manager'),
  getTransactions
);

/**
 * GET /api/transactions/:id
 * Admin, cashier, and inventory_manager can view one transaction.
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'cashier', 'inventory_manager'),
  validateTransactionId,
  getTransactionById
);

module.exports = router;
