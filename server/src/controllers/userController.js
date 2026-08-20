'use strict';

const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

/**
 * Remove password from user response.
 */
const sanitizeUser = (user) => {
  const data = user.toJSON ? user.toJSON() : { ...user };
  delete data.password;
  return data;
};

/**
 * GET /api/users
 * List users.
 *
 * Admin only.
 *
 * Optional query:
 * ?search=jane
 * ?role=cashier
 * ?isActive=true
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, role, isActive } = req.query;

    const where = {};

    // Search by name or email
    if (search) {
      where[Op.or] = [
        {
          name: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          email: {
            [Op.iLike]: `%${search}%`,
          },
        },
      ];
    }

    // Filter by role
    if (role) {
      const validRoles = [
        'admin',
        'inventory_manager',
        'cashier',
      ];

      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: 'Invalid role.',
        });
      }

      where.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      if (isActive !== 'true' && isActive !== 'false') {
        return res.status(400).json({
          success: false,
          status: 400,
          message: 'isActive must be true or false.',
        });
      }

      where.isActive = isActive === 'true';
    }

    const users = await User.findAll({
      where,
      attributes: {
        exclude: ['password'],
      },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Get one user.
 *
 * Admin only.
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ['password'],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users
 * Create a user.
 *
 * Admin only.
 */
const createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'cashier',
    } = req.body;

    // Check duplicate email
    const existingUser = await User.findOne({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        status: 409,
        message: 'A user with this email already exists.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 * Update user information.
 *
 * Admin only.
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'User not found.',
      });
    }

    const {
      name,
      email,
      role,
      isActive,
    } = req.body;

    // Check email uniqueness if email is changing
    if (
      email &&
      email.toLowerCase() !== user.email.toLowerCase()
    ) {
      const existingUser = await User.findOne({
        where: {
          email: email.toLowerCase(),
          id: {
            [Op.ne]: id,
          },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          status: 409,
          message: 'A user with this email already exists.',
        });
      }
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      updateData.email = email.toLowerCase();
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    // Prevent deactivating admin accounts via updateUser
    if (isActive === false && user.role === 'admin') {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Admin accounts cannot be deactivated.',
      });
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    await user.update(updateData);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/password
 * Change user password.
 *
 * Admin only.
 */
const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'User not found.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await user.update({
      password: hashedPassword,
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/deactivate
 * Deactivate a user.
 *
 * Admin only.
 */
const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'User not found.',
      });
    }

    // Prevent admin from accidentally deactivating
    // the currently logged-in account.
    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'You cannot deactivate your own account.',
      });
    }

    // Prevent deactivating admin accounts
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Admin accounts cannot be deactivated.',
      });
    }

    await user.update({
      isActive: false,
    });

    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully.',
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deactivateUser,
};
