/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - UTILITIES                          ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate unique user ID
 */
function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash password with bcrypt
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, config.security.bcryptRounds);
}

/**
 * Verify password
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 * @param {Object} payload
 * @returns {string}
 */
function generateToken(payload) {
  return jwt.sign(payload, config.security.jwtSecret, {
    expiresIn: config.security.jwtExpiry,
  });
}

/**
 * Verify JWT token
 * @param {string} token
 * @returns {Object|null}
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.security.jwtSecret);
  } catch (error) {
    return null;
  }
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  // Simple validation - at least 10 digits
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Format phone number for WhatsApp
 * @param {string} phone
 * @returns {string}
 */
function formatPhoneForWhatsApp(phone) {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  return `${cleaned}@c.us`;
}

/**
 * Sleep utility
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format duration in ms to human-readable string
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Sanitize filename
 * @param {string} filename
 * @returns {string}
 */
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

module.exports = {
  generateUserId,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  isValidEmail,
  isValidPhone,
  formatPhoneForWhatsApp,
  sleep,
  formatDuration,
  sanitizeFilename,
};
