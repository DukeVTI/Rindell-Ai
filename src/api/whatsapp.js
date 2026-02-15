/**
 * WhatsApp API Routes
 * 
 * Endpoints for WhatsApp connection management.
 */

const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsapp');
const whatsappHandler = require('../services/whatsapp/handler');
const { authenticate } = require('./middleware');
const QRCode = require('qrcode');

/**
 * POST /api/whatsapp/connect
 * Initialize WhatsApp connection for authenticated user
 */
router.post('/connect', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if already connected
    if (whatsappService.isConnected(userId)) {
      return res.json({
        success: true,
        message: 'WhatsApp already connected',
        connected: true,
      });
    }

    // Start connection process
    let qrCodeData = null;
    let connectionEstablished = false;

    await whatsappService.connect(
      userId,
      // onQR callback
      async (qr) => {
        qrCodeData = qr;
        // Generate QR code image
        const qrImage = await QRCode.toDataURL(qr);
        
        // Store in instance for status endpoint
        const status = whatsappService.getStatus(userId);
        status.qrCodeImage = qrImage;
      },
      // onReady callback
      (user) => {
        connectionEstablished = true;
        console.log(`[WhatsApp API] Connection established for user ${userId}`);
      },
      // onMessage callback
      (userId, message, fromJid) => {
        whatsappHandler.handleMessage(userId, message, fromJid).catch(err => {
          console.error('[WhatsApp API] Error in message handler:', err);
        });
      }
    );

    res.json({
      success: true,
      message: 'WhatsApp connection initiated. Please scan QR code.',
      connected: connectionEstablished,
      qrCode: qrCodeData,
    });

  } catch (error) {
    console.error('[WhatsApp API] Connect error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/status
 * Get current WhatsApp connection status
 */
router.get('/status', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const status = whatsappService.getStatus(userId);

    res.json({
      success: true,
      ...status,
    });

  } catch (error) {
    console.error('[WhatsApp API] Status error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/qr
 * Get QR code for connection (if available)
 */
router.get('/qr', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = whatsappService.getStatus(userId);

    if (!status.qrCode) {
      return res.status(404).json({
        success: false,
        message: 'No QR code available. Connection may already be established or not initiated.',
      });
    }

    // Generate QR code image
    const qrImage = await QRCode.toDataURL(status.qrCode);

    res.json({
      success: true,
      qrCode: status.qrCode,
      qrCodeImage: qrImage,
    });

  } catch (error) {
    console.error('[WhatsApp API] QR error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/disconnect
 * Disconnect WhatsApp for authenticated user
 */
router.post('/disconnect', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    await whatsappService.disconnect(userId);

    res.json({
      success: true,
      message: 'WhatsApp disconnected successfully',
    });

  } catch (error) {
    console.error('[WhatsApp API] Disconnect error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/connected-users
 * Get list of all connected users (admin endpoint)
 */
router.get('/connected-users', authenticate, (req, res) => {
  try {
    // TODO: Add admin role check
    const users = whatsappService.getConnectedUsers();

    res.json({
      success: true,
      count: users.length,
      users,
    });

  } catch (error) {
    console.error('[WhatsApp API] Connected users error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
