'use strict';

// Load environment variables first, before any other imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const path = require('path');

const { sequelize, syncDatabase } = require('./src/models');
const errorHandler = require('./src/middleware/errorHandler');

// Phase 3: Authentication routes
const authRoutes = require('./src/routes/auth');

// Phase 4: Product routes
const productRoutes = require('./src/routes/products');

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve uploaded product images
app.use('/uploads', express.static('uploads'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TEEROP POS API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ── Root route ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TEEROP POS API is running',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./src/routes/users'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/transactions', require('./src/routes/transactions'));
app.use('/api/statistics', require('./src/routes/statistics'));

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Centralised error handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] PostgreSQL connection established');

    await syncDatabase();

    app.listen(PORT, () => {
      console.log(`[Server] TEEROP POS API running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
};

start();