'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tax rate defined in spec: 5%
const TAX_RATE = 0.05;

const Transaction = sequelize.define(
  'Transaction',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // cashierId is the foreign key — defined via association in index.js
    cashierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Subtotal must be a valid number' },
        min: { args: [0], msg: 'Subtotal cannot be negative' },
      },
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Tax must be a valid number' },
        min: { args: [0], msg: 'Tax cannot be negative' },
      },
    },
    grandTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Grand total must be a valid number' },
        min: { args: [0], msg: 'Grand total cannot be negative' },
      },
    },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      { fields: ['cashierId'] },
      { fields: ['createdAt'] },
    ],
  }
);

Transaction.TAX_RATE = TAX_RATE;

module.exports = Transaction;
