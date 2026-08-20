'use strict';

const { Op } = require('sequelize');
const { sequelize, Transaction, TransactionItem, Product, User } = require('../models');

const TAX_RATE = 0.05;

/**
 * POST /api/transactions
 *
 * Creates a sale, decreases stock, calculates:
 * subtotal → 5% tax → grand total
 */
const createTransaction = async (req, res, next) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const { items } = req.body;

    // Make sure cashier still exists and is active
    const cashier = await User.findByPk(req.user.id);

    if (!cashier || !cashier.isActive) {
      await dbTransaction.rollback();

      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Cashier account is inactive.',
      });
    }

    let subtotal = 0;
    const transactionItems = [];

    // Process every requested product
    for (const item of items) {
      const product = await Product.findOne({
        where: {
          id: item.productId,
          isActive: true,
        },
        transaction: dbTransaction,
        lock: dbTransaction.LOCK.UPDATE,
      });

      if (!product) {
        await dbTransaction.rollback();

        return res.status(404).json({
          success: false,
          status: 404,
          message: `Product ${item.productId} not found or is inactive.`,
        });
      }

      // Check stock
      if (product.quantity < item.quantity) {
        await dbTransaction.rollback();

        return res.status(400).json({
          success: false,
          status: 400,
          message: `Insufficient stock for "${product.name}". Available: ${product.quantity}, requested: ${item.quantity}.`,
        });
      }

      const unitPrice = Number(product.price);
      const quantity = Number(item.quantity);
      const lineSubtotal = unitPrice * quantity;

      subtotal += lineSubtotal;

      transactionItems.push({
        product,
        quantity,
        unitPrice,
        lineSubtotal,
      });
    }

    // Calculate totals
    subtotal = Number(subtotal.toFixed(2));

    const tax = Number((subtotal * TAX_RATE).toFixed(2));

    const grandTotal = Number(
      (subtotal + tax).toFixed(2)
    );

    // Create transaction
    const sale = await Transaction.create(
      {
        cashierId: req.user.id,
        subtotal,
        tax,
        grandTotal,
      },
      {
        transaction: dbTransaction,
      }
    );

    // Create transaction items and reduce stock
    for (const item of transactionItems) {
      await TransactionItem.create(
        {
          transactionId: sale.id,
          productId: item.product.id,
          productName: item.product.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineSubtotal: item.lineSubtotal,
        },
        {
          transaction: dbTransaction,
        }
      );

      await item.product.decrement('quantity', {
        by: item.quantity,
        transaction: dbTransaction,
      });
    }

    await dbTransaction.commit();

    // Return complete transaction
    const completeTransaction = await Transaction.findByPk(sale.id, {
      include: [
        {
          model: TransactionItem,
          as: 'items',
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction completed successfully.',
      transaction: completeTransaction,
    });
  } catch (err) {
    try {
      await dbTransaction.rollback();
    } catch (_) {
      // Transaction may already have been rolled back.
    }

    next(err);
  }
};

/**
 * GET /api/transactions
 *
 * Admin and inventory_manager see all transactions.
 * Cashier only sees their own transactions.
 */
const getTransactions = async (req, res, next) => {
  try {
    const where = {};

    if (req.user.role === 'cashier') {
      where.cashierId = req.user.id;
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: TransactionItem,
          as: 'items',
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/transactions/:id
 */
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          model: TransactionItem,
          as: 'items',
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Transaction not found.',
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
};
