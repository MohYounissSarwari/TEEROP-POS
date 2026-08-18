'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransactionItem = sequelize.define(
  'TransactionItem',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    // Snapshot fields — stored at time of sale so receipt is always accurate
    // even if product name or price changes later.
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name snapshot cannot be empty' },
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Unit price must be a valid number' },
        min: { args: [0], msg: 'Unit price cannot be negative' },
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'Quantity must be an integer' },
        min: { args: [1], msg: 'Quantity must be at least 1' },
      },
    },
    lineSubtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Line subtotal must be a valid number' },
        min: { args: [0], msg: 'Line subtotal cannot be negative' },
      },
    },
  },
  {
    tableName: 'transaction_items',
    timestamps: true,
    indexes: [
      { fields: ['transactionId'] },
      { fields: ['productId'] },
    ],
  }
);

module.exports = TransactionItem;
