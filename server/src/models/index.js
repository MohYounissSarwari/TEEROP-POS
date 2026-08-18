'use strict';

const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Transaction = require('./Transaction');
const TransactionItem = require('./TransactionItem');

// ── Associations ─────────────────────────────────────────────────────────────

// A cashier (User) processes many Transactions
User.hasMany(Transaction, {
  foreignKey: { name: 'cashierId', allowNull: false },
  as: 'transactions',
});
Transaction.belongsTo(User, {
  foreignKey: { name: 'cashierId', allowNull: false },
  as: 'cashier',
});

// A Transaction contains many TransactionItems
Transaction.hasMany(TransactionItem, {
  foreignKey: { name: 'transactionId', allowNull: false },
  as: 'items',
  onDelete: 'CASCADE',
});
TransactionItem.belongsTo(Transaction, {
  foreignKey: { name: 'transactionId', allowNull: false },
  as: 'transaction',
});

// A Product appears in many TransactionItems
Product.hasMany(TransactionItem, {
  foreignKey: { name: 'productId', allowNull: false },
  as: 'transactionItems',
});
TransactionItem.belongsTo(Product, {
  foreignKey: { name: 'productId', allowNull: false },
  as: 'product',
});

// ── Sync helper ──────────────────────────────────────────────────────────────

/**
 * Synchronise all models with the database.
 * Uses { alter: true } in development — safe, non-destructive.
 * Does nothing in production (migrations handle schema changes there).
 */
const syncDatabase = async () => {
  if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: true });
    console.log('[DB] Models synchronised (alter: true)');
  }
};

module.exports = {
  sequelize,
  User,
  Product,
  Transaction,
  TransactionItem,
  syncDatabase,
};
