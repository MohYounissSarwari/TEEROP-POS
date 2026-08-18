'use strict';

// Load environment variables first, before any other imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { sequelize, syncDatabase } = require('./src/models');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TEEROP POS API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes (added in later phases) ───────────────────────────────────────────
// app.use('/api/auth',     require('./src/routes/auth'));
// app.use('/api/users',    require('./src/routes/users'));
// app.use('/api/products', require('./src/routes/products'));

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Centralised error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Verify the database connection
    await sequelize.authenticate();
    console.log('[DB] PostgreSQL connection established');

    // Sync models (development only — alter: true, non-destructive)
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
