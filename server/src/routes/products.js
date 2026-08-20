'use strict';

const { Router } = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');

const {
  createProduct,
  getProducts,
  getLowStockProducts,
  getProductById,
  updateProduct,
  restockProduct,
  deactivateProduct,
  uploadProductImage,
} = require('../controllers/productController');

const {
  validateCreateProduct,
  validateUpdateProduct,
  validateRestock,
} = require('../validators/productValidators');

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products
// Admin, Inventory Manager, Cashier
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  authorize('admin', 'inventory_manager', 'cashier'),
  getProducts
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/low-stock
// Admin, Inventory Manager
// IMPORTANT: This route must come BEFORE /:id
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/low-stock',
  authenticate,
  authorize('admin', 'inventory_manager'),
  getLowStockProducts
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products
// Admin, Inventory Manager
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('admin', 'inventory_manager'),
  validateCreateProduct,
  createProduct
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/:id
// Admin, Inventory Manager, Cashier
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'inventory_manager', 'cashier'),
  getProductById
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/products/:id
// Admin, Inventory Manager
// ─────────────────────────────────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'inventory_manager'),
  validateUpdateProduct,
  updateProduct
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/products/:id/restock
// Admin, Inventory Manager
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  '/:id/restock',
  authenticate,
  authorize('admin', 'inventory_manager'),
  validateRestock,
  restockProduct
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/products/:id/deactivate
// Admin, Inventory Manager
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  '/:id/deactivate',
  authenticate,
  authorize('admin', 'inventory_manager'),
  deactivateProduct
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products/:id/image
// Admin, Inventory Manager
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/image',
  authenticate,
  authorize('admin', 'inventory_manager'),
  upload.single('image'),
  uploadProductImage
);

module.exports = router;