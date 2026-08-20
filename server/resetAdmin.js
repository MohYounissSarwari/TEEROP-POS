'use strict';

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./src/models');

async function resetAdmin() {
  try {
    await sequelize.authenticate();

    const admin = await User.findOne({
      where: { email: 'admin@teerop.com' },
    });

    if (!admin) {
      console.log('Admin user not found.');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash('Admin1234', 10);

    await admin.update({
      password: hashedPassword,
      isActive: true,
    });

    console.log('Admin password reset successfully.');
    console.log('Email: admin@teerop.com');
    console.log('Password: Admin1234');

    await sequelize.close();
  } catch (error) {
    console.error('Reset failed:', error.message);
    process.exit(1);
  }
}

resetAdmin();