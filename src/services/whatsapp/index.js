/**
 * WhatsApp Service
 * 
 * Manages WhatsApp connections using Baileys library.
 * Handles QR code generation, session persistence, and message listening.
 */

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../config');
const db = require('../../database');

class WhatsAppService {
  constructor() {
    this.connections = new Map(); // userId -> connection instance
    this.logger = pino({ level: config.server.logLevel || 'info' });
  }

  /**
   * Initialize WhatsApp connection for a user
   */
  async connect(userId, onQR, onReady, onMessage) {
    if (this.connections.has(userId)) {
      const existing = this.connections.get(userId);
      if (existing.connected) {
        throw new Error('WhatsApp already connected for this user');
      }
      // Clean up old connection
      await this.disconnect(userId);
    }

    const authDir = path.join(config.whatsapp.authDir, userId);
    await fs.mkdir(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }), // Reduce Baileys noise
      browser: ['Rindell AI', 'Chrome', '1.0.0'],
    });

    const instance = {
      sock,
      userId,
      connected: false,
      qrCode: null,
      connectedAt: null,
      authDir,
    };

    this.connections.set(userId, instance);

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        instance.qrCode = qr;
        this.logger.info({ userId }, 'QR code generated');
        if (onQR) onQR(qr);
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        this.logger.info({ 
          userId, 
          shouldReconnect,
          reason: lastDisconnect?.error?.message 
        }, 'WhatsApp connection closed');

        instance.connected = false;
        
        // Update database
        await db.updateWhatsAppSession(userId, {
          connected: false,
          disconnected_at: new Date(),
        });

        if (shouldReconnect) {
          // Reconnect after delay
          setTimeout(() => {
            this.logger.info({ userId }, 'Attempting to reconnect WhatsApp');
            this.connect(userId, onQR, onReady, onMessage).catch(err => {
              this.logger.error({ userId, err }, 'Failed to reconnect WhatsApp');
            });
          }, 5000);
        } else {
          // User logged out, remove connection
          this.connections.delete(userId);
        }
      }

      if (connection === 'open') {
        instance.connected = true;
        instance.connectedAt = new Date();
        instance.qrCode = null;
        
        const user = sock.user;
        
        this.logger.info({ 
          userId, 
          whatsappId: user.id 
        }, 'WhatsApp connected successfully');

        // Save session to database
        await db.createOrUpdateWhatsAppSession({
          user_id: userId,
          whatsapp_number: user.id.split(':')[0],
          connected: true,
          connected_at: instance.connectedAt,
          session_data: JSON.stringify({ id: user.id, name: user.name }),
        });

        if (onReady) onReady(user);
      }
    });

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return; // Only process new messages

      for (const message of messages) {
        // Skip messages from self
        if (message.key.fromMe) continue;
        
        try {
          await this.handleMessage(userId, message, onMessage);
        } catch (error) {
          this.logger.error({ userId, error, messageId: message.key.id }, 'Error handling message');
        }
      }
    });

    return instance;
  }

  /**
   * Handle incoming WhatsApp message
   */
  async handleMessage(userId, message, onMessage) {
    const { key, message: content } = message;
    const fromJid = key.remoteJid;
    
    // Check if message contains a document
    const hasDocument = content?.documentMessage || 
                       content?.imageMessage || 
                       content?.documentWithCaptionMessage;

    if (!hasDocument) {
      return; // Ignore non-document messages
    }

    this.logger.info({ 
      userId, 
      from: fromJid,
      messageId: key.id,
      hasDocument: !!hasDocument
    }, 'Document detected in WhatsApp message');

    // Trigger callback if provided
    if (onMessage) {
      await onMessage(userId, message, fromJid);
    }
  }

  /**
   * Download media from a message
   */
  async downloadMedia(userId, message) {
    const instance = this.connections.get(userId);
    if (!instance) {
      throw new Error('WhatsApp not connected for this user');
    }

    const messageContent = message.message?.documentMessage || 
                          message.message?.imageMessage ||
                          message.message?.documentWithCaptionMessage?.documentMessage;

    if (!messageContent) {
      throw new Error('No media found in message');
    }

    // Download the media
    const buffer = await downloadMediaMessage(message, 'buffer', {}, {
      logger: this.logger,
      reuploadRequest: instance.sock.updateMediaMessage
    });

    // Get filename
    const filename = messageContent.fileName || 
                    messageContent.caption || 
                    `document_${Date.now()}`;

    // Get mimetype
    const mimetype = messageContent.mimetype || 'application/octet-stream';

    return {
      buffer,
      filename,
      mimetype,
      filesize: buffer.length,
    };
  }

  /**
   * Send a message to a WhatsApp user
   */
  async sendMessage(userId, toJid, text) {
    const instance = this.connections.get(userId);
    if (!instance || !instance.connected) {
      throw new Error('WhatsApp not connected for this user');
    }

    await instance.sock.sendMessage(toJid, { text });
    
    this.logger.info({ userId, toJid }, 'Message sent via WhatsApp');
  }

  /**
   * Disconnect WhatsApp for a user
   */
  async disconnect(userId) {
    const instance = this.connections.get(userId);
    if (!instance) return;

    try {
      if (instance.sock) {
        await instance.sock.logout();
      }
    } catch (error) {
      this.logger.error({ userId, error }, 'Error during disconnect');
    }

    // Update database
    await db.updateWhatsAppSession(userId, {
      connected: false,
      disconnected_at: new Date(),
    });

    this.connections.delete(userId);
    this.logger.info({ userId }, 'WhatsApp disconnected');
  }

  /**
   * Get connection status for a user
   */
  getStatus(userId) {
    const instance = this.connections.get(userId);
    if (!instance) {
      return {
        connected: false,
        qrCode: null,
      };
    }

    return {
      connected: instance.connected,
      qrCode: instance.qrCode,
      connectedAt: instance.connectedAt,
    };
  }

  /**
   * Check if user is connected
   */
  isConnected(userId) {
    const instance = this.connections.get(userId);
    return instance && instance.connected;
  }

  /**
   * Get all connected users
   */
  getConnectedUsers() {
    const users = [];
    for (const [userId, instance] of this.connections) {
      if (instance.connected) {
        users.push({
          userId,
          connectedAt: instance.connectedAt,
        });
      }
    }
    return users;
  }

  /**
   * Restore sessions from database on startup
   */
  async restoreSessions(onMessage) {
    const sessions = await db.getActiveWhatsAppSessions();
    
    this.logger.info({ count: sessions.length }, 'Restoring WhatsApp sessions');

    for (const session of sessions) {
      try {
        await this.connect(
          session.user_id,
          null, // No QR callback on restore
          null, // No ready callback on restore
          onMessage // Pass message handler
        );
      } catch (error) {
        this.logger.error({ 
          userId: session.user_id, 
          error 
        }, 'Failed to restore WhatsApp session');
      }
    }
  }

  /**
   * Graceful shutdown - disconnect all
   */
  async shutdown() {
    this.logger.info('Shutting down WhatsApp service');
    
    const disconnectPromises = [];
    for (const userId of this.connections.keys()) {
      disconnectPromises.push(
        this.disconnect(userId).catch(err => 
          this.logger.error({ userId, err }, 'Error during shutdown disconnect')
        )
      );
    }

    await Promise.all(disconnectPromises);
  }
}

module.exports = new WhatsAppService();
