/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - AUTHENTICATION ROUTES              ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const {
  hashPassword,
  verifyPassword,
  generateToken,
  isValidEmail,
  isValidPhone,
} = require('../utils');

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    // Validation
    if (!fullName || !email || !phoneNumber || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['fullName', 'email', 'phoneNumber', 'password'],
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await db.createUser(fullName, email, phoneNumber, passwordHash);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    console.log(`✅ User registered: ${user.email} (ID: ${user.id})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phoneNumber: user.phone_number,
        whatsappConnected: false,
      },
      token,
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    console.log(`✅ User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phoneNumber: user.phone_number,
        whatsappConnected: user.whatsapp_connected,
      },
      token,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', async (req, res) => {
  try {
    // req.user is set by auth middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phoneNumber: user.phone_number,
        whatsappConnected: user.whatsapp_connected,
        createdAt: user.created_at,
      },
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info', message: error.message });
  }
});

module.exports = router;
