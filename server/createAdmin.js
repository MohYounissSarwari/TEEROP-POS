'use strict';

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./src/models');

const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connected');

    const existing = await User.findOne({
      where: { email: 'admin@teerop.com' }
    });

    if (existing) {
      console.log('[Admin] admin@teerop.com already exists.');
      return;
    }

    const password = 'Admin1234';
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@teerop.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    console.log('[Admin] Admin created successfully.');
    console.log('[Admin] Email:', admin.email);
    console.log('[Admin] Password:', password);
  } catch (error) {
    console.error('[Admin] Failed:', error.message);
  } finally {
    await sequelize.close();
  }
};

createAdmin();