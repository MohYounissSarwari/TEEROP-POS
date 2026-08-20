'use strict';

const { Op } = require('sequelize');
const { Product } = require('../models');

/**
 * Helper: return a clean product object.
 */
const sanitizeProduct = (product) => {
  return product.toJSON ? product.toJSON() : product;
};

/**
 * Check category-specific fields.
 */
const validateCategoryFields = (data) => {
  const errors = [];
  const category = data.category;

  if (category === 'Cold') {
    if (!data.expiryDate) {
      errors.push('Expiry date is required for Cold products.');
    }

    if (!data.storageTemp) {
      errors.push('Storage temperature is required for Cold products.');
    }
  }

  if (category === 'Tech') {
    if (!data.warrantyPeriod) {
      errors.push('Warranty period is required for Tech products.');
    }

    if (!data.serialNumber) {
      errors.push('Serial number is required for Tech products.');
    }
  }

  if (category === 'Fragile') {
    if (typeof data.isFragile !== 'boolean') {
      errors.push('isFragile must be true or false for Fragile products.');
    }

    if (!data.handlingNote) {
      errors.push('Handling note is required for Fragile products.');
    }
  }

  if (category === 'Cleaning') {
    if (typeof data.isHazardous !== 'boolean') {
      errors.push('isHazardous must be true or false for Cleaning products.');
    }

    if (!data.safetyNote) {
      errors.push('Safety note is required for Cleaning products.');
    }
  }

  return errors;
};

/**
 * POST /api/products
 * Create a new product.
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      price,
      quantity,
      reorderThreshold,
      imageUrl,
      description,
      handlingNote,
      isFragile,
      expiryDate,
      storageTemp,
      warrantyPeriod,
      serialNumber,
      isHazardous,
      safetyNote,
    } = req.body;

    // Check duplicate SKU
    const existingSku = await Product.findOne({
      where: { sku },
    });

    if (existingSku) {
      return res.status(409).json({
        success: false,
        status: 409,
        message: 'A product with this SKU already exists.',
      });
    }

    // Category-specific validation
    const categoryErrors = validateCategoryFields(req.body);

    if (categoryErrors.length > 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Category-specific validation failed.',
        errors: categoryErrors,
      });
    }

    // Tech serial number must be unique
    if (category === 'Tech' && serialNumber) {
      const existingSerial = await Product.findOne({
        where: { serialNumber },
      });

      if (existingSerial) {
        return res.status(409).json({
          success: false,
          status: 409,
          message: 'A product with this serial number already exists.',
        });
      }
    }

    const product = await Product.create({
      name,
      sku,
      category,
      price,
      quantity,
      reorderThreshold,
      imageUrl,
      description,
      handlingNote,
      isFragile,
      expiryDate,
      storageTemp,
      warrantyPeriod,
      serialNumber,
      isHazardous,
      safetyNote,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: sanitizeProduct(product),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products
 * List products with optional search/filter.
 */
const getProducts = async (req, res, next) => {
  try {
    const { search, category, isActive } = req.query;

    const where = {};

    // Default: only active products
    where.isActive = true;

    // Search name or SKU
    if (search) {
      where[Op.or] = [
        {
          name: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          sku: {
            [Op.iLike]: `%${search}%`,
          },
        },
      ];
    }

    // Category filter
    if (category) {
      const validCategories = [
        'Fragile',
        'Cold',
        'Tech',
        'Cleaning',
        'General',
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: 'Invalid category.',
        });
      }

      where.category = category;
    }

    /**
     * Only Admin can request deactivated products.
     *
     * Examples:
     * Admin:
     *   ?isActive=false
     *
     * Cashier / Inventory Manager:
     *   always receive active products.
     */
    if (isActive !== undefined) {
      const requestedValue = isActive === 'true';

      if (req.user.role === 'admin') {
        where.isActive = requestedValue;
      }
    }

    const products = await Product.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/low-stock
 * Products where quantity <= reorderThreshold.
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: {
        isActive: true,
        [Op.and]: [
          {
            quantity: {
              [Op.lte]: Product.sequelize.col('reorderThreshold'),
            },
          },
        ],
      },
      order: [['quantity', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Product not found.',
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Product not found.',
      });
    }

    const {
      name,
      sku,
      category,
      price,
      quantity,
      reorderThreshold,
      imageUrl,
      description,
      handlingNote,
      isFragile,
      expiryDate,
      storageTemp,
      warrantyPeriod,
      serialNumber,
      isHazardous,
      safetyNote,
    } = req.body;

    // Check SKU uniqueness if changing SKU
    if (sku && sku !== product.sku) {
      const existingSku = await Product.findOne({
        where: {
          sku,
          id: {
            [Op.ne]: id,
          },
        },
      });

      if (existingSku) {
        return res.status(409).json({
          success: false,
          status: 409,
          message: 'A product with this SKU already exists.',
        });
      }
    }

    // Check serial number uniqueness
    if (serialNumber && serialNumber !== product.serialNumber) {
      const existingSerial = await Product.findOne({
        where: {
          serialNumber,
          id: {
            [Op.ne]: id,
          },
        },
      });

      if (existingSerial) {
        return res.status(409).json({
          success: false,
          status: 409,
          message: 'A product with this serial number already exists.',
        });
      }
    }

    const updatedData = {
      name,
      sku,
      category,
      price,
      quantity,
      reorderThreshold,
      imageUrl,
      description,
      handlingNote,
      isFragile,
      expiryDate,
      storageTemp,
      warrantyPeriod,
      serialNumber,
      isHazardous,
      safetyNote,
    };

    // Remove undefined values so omitted fields stay unchanged
    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] === undefined) {
        delete updatedData[key];
      }
    });

    const finalCategory = updatedData.category || product.category;

    const categoryCheck = validateCategoryFields({
      ...product.toJSON(),
      ...updatedData,
      category: finalCategory,
    });

    if (categoryCheck.length > 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Category-specific validation failed.',
        errors: categoryCheck,
      });
    }

    await product.update(updatedData);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: sanitizeProduct(product),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/products/:id/restock
 */
const restockProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Product not found.',
      });
    }

    await product.increment('quantity', {
      by: amount,
    });

    await product.reload();

    return res.status(200).json({
      success: true,
      message: 'Product restocked successfully.',
      product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/products/:id/deactivate
 */
const deactivateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Product not found.',
      });
    }

    await product.update({
      isActive: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Product deactivated successfully.',
      product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products/:id/image
 */
const uploadProductImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Product not found.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Image file is required.',
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    await product.update({
      imageUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Product image uploaded successfully.',
      product,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getLowStockProducts,
  getProductById,
  updateProduct,
  restockProduct,
  deactivateProduct,
  uploadProductImage,
};