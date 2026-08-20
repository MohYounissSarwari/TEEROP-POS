'use strict';

const { Op } = require('sequelize');
const {
  sequelize,
  Transaction,
  TransactionItem,
  Product,
  User,
} = require('../models');

/**
 * GET /api/statistics/dashboard
 * Admin and inventory_manager
 */
const getDashboardStatistics = async (req, res, next) => {
  try {
    const totalProducts = await Product.count({
      where: { isActive: true },
    });

    const lowStockProducts = await Product.count({
      where: {
        isActive: true,
        quantity: {
          [Op.lte]: sequelize.col('reorderThreshold'),
        },
      },
    });

    const totalUsers = await User.count({
      where: { isActive: true },
    });

    const totalTransactions = await Transaction.count();

    // Total sales (all time)
    const allSales = await Transaction.findAll({
      attributes: ['grandTotal'],
    });

    const totalSales = allSales.reduce(
      (sum, t) => sum + Number(t.grandTotal),
      0
    );

    // Today's sales — from midnight UTC
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const todaySalesRows = await Transaction.findAll({
      attributes: ['grandTotal'],
      where: {
        createdAt: {
          [Op.gte]: startOfToday,
        },
      },
    });

    const todaySales = todaySalesRows.reduce(
      (sum, t) => sum + Number(t.grandTotal),
      0
    );

    // Top 5 products by quantity sold
    const topSellingProducts = await TransactionItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('TransactionItem.quantity')), 'totalSold'],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'sku'],
        },
      ],
      group: ['productId', 'product.id'],
      order: [[sequelize.fn('SUM', sequelize.col('TransactionItem.quantity')), 'DESC']],
      limit: 5,
      subQuery: false,
    });

    const topSelling = topSellingProducts.map((row) => ({
      productId: row.productId,
      productName: row.product ? row.product.name : null,
      sku: row.product ? row.product.sku : null,
      totalSold: Number(row.dataValues.totalSold),
    }));

    return res.status(200).json({
      success: true,
      statistics: {
        totalProducts,
        lowStockProducts,
        totalUsers,
        totalTransactions,
        totalSales: Number(totalSales.toFixed(2)),
        todaySales: Number(todaySales.toFixed(2)),
        topSellingProducts: topSelling,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/statistics/sales
 * Admin only
 */
const getSalesStatistics = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      attributes: [
        'id',
        'subtotal',
        'tax',
        'grandTotal',
        'cashierId',
        'createdAt',
      ],
      include: [
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const totalSales = transactions.reduce(
      (sum, transaction) =>
        sum + Number(transaction.grandTotal),
      0
    );

    return res.status(200).json({
      success: true,
      count: transactions.length,
      totalSales: Number(totalSales.toFixed(2)),
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/statistics/inventory
 * Inventory manager (and admin)
 */
const getInventoryStatistics = async (req, res, next) => {
  try {
    const totalActiveProducts = await Product.count({
      where: { isActive: true },
    });

    const totalLowStockProducts = await Product.count({
      where: {
        isActive: true,
        quantity: {
          [Op.lte]: sequelize.col('reorderThreshold'),
        },
      },
    });

    // Count of distinct categories among active products
    const categoryRows = await Product.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('category'))), 'totalCategories'],
      ],
      where: { isActive: true },
      raw: true,
    });

    const totalCategories = Number(categoryRows[0]?.totalCategories ?? 0);

    // Last 10 transactions — read-only, no items
    const recentTransactions = await Transaction.findAll({
      attributes: ['id', 'grandTotal', 'createdAt'],
      include: [
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    return res.status(200).json({
      success: true,
      statistics: {
        totalActiveProducts,
        totalLowStockProducts,
        totalCategories,
        recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStatistics,
  getSalesStatistics,
  getInventoryStatistics,
};
