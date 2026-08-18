'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CATEGORIES = ['Fragile', 'Cold', 'Tech', 'Cleaning', 'General'];

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { name: 'products_sku_unique', msg: 'SKU already exists' },
      validate: {
        notEmpty: { msg: 'SKU cannot be empty' },
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name cannot be empty' },
      },
    },
    category: {
      type: DataTypes.ENUM(...CATEGORIES),
      allowNull: false,
      validate: {
        isIn: { args: [CATEGORIES], msg: 'Invalid category' },
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Price must be a valid number' },
        min: { args: [0], msg: 'Price cannot be negative' },
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: { msg: 'Quantity must be an integer' },
        min: { args: [0], msg: 'Quantity cannot be negative' },
      },
    },
    reorderThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: { msg: 'Reorder threshold must be an integer' },
        min: { args: [0], msg: 'Reorder threshold cannot be negative' },
      },
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    // ── Fragile ──────────────────────────────────────────────────────────────
    handlingNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isFragile: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },

    // ── Cold ─────────────────────────────────────────────────────────────────
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    storageTemp: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // ── Tech ─────────────────────────────────────────────────────────────────
    warrantyPeriod: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    serialNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: {
        name: 'products_serial_number_unique',
        msg: 'Serial number already exists',
      },
    },

    // ── Cleaning ─────────────────────────────────────────────────────────────
    isHazardous: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    safetyNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'products',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['sku'] },
      { fields: ['category'] },
      { fields: ['isActive'] },
      { fields: ['quantity'] },
    ],
  }
);

module.exports = Product;
