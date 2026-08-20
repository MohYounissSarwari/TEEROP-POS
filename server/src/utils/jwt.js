'use strict';

const jwt = require('jsonwebtoken');

const SECRET = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return process.env.JWT_SECRET;
};

const EXPIRES_IN = () => process.env.JWT_EXPIRES_IN || '8h';

/**
 * Sign a JWT for the given user.
 * Payload contains only non-sensitive identity fields.
 *
 * @param {object} user  Sequelize User instance
 * @returns {string}     Signed JWT string
 */
const signToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, SECRET(), { expiresIn: EXPIRES_IN() });
};

/**
 * Verify and decode a JWT string.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 *
 * @param {string} token
 * @returns {object}  Decoded payload
 */
const verifyToken = (token) => jwt.verify(token, SECRET());

module.exports = { signToken, verifyToken };
