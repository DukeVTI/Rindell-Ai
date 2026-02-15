/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║         RINDELL AI - WEB DASHBOARD SERVER                ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * Web-based platform for managing WhatsApp document analysis
 * Multi-user support with beautiful landing page
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.WEB_PORT || 8080;

// Store active user sessions and WhatsApp connections
const userSessions = new Map();
const whatsappInstances = new Map();

/* ═══════════════════════════════════════════════════════════
   CONFIGURATION
   ═══════════════════════════════════════════════════════════ */

const CONFIG = {
  WEB_PORT: PORT,
  DATA_DIR: path.join(__dirname, 'user-data'),
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  API_SERVER_URL: process.env.API_SERVER_URL || 'http://localhost:3000/analyze',
};

// Ensure data directory exists
if (!fs.existsSync(CONFIG.DATA_DIR)) {
  fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
}

/* ═══════════════════════════════════════════════════════════
   MIDDLEWARE
   ═══════════════════════════════════════════════════════════ */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* ═══════════════════════════════════════════════════════════
   USER SESSION MANAGEMENT
   ═══════════════════════════════════════════════════════════ */

/**
 * Generate unique user ID
 */
function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create new user session
 */
function createUserSession(userData) {
  const userId = generateUserId();
  const session = {
    id: userId,
    name: userData.name || 'User',
    phone: userData.phone || '',
    createdAt: new Date().toISOString(),
    whatsappConnected: false,
    qrCode: null,
    documentsProcessed: 0,
  };
  
  userSessions.set(userId, session);
  
  // Create user directory
  const userDir = path.join(CONFIG.DATA_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  // Save session to file
  fs.writeFileSync(
    path.join(userDir, 'session.json'),
    JSON.stringify(session, null, 2)
  );
  
  return session;
}

/**
 * Get user session
 */
function getUserSession(userId) {
  return userSessions.get(userId);
}

/**
 * Load existing sessions on startup
 */
function loadExistingSessions() {
  if (!fs.existsSync(CONFIG.DATA_DIR)) return;
  
  const userDirs = fs.readdirSync(CONFIG.DATA_DIR);
  
  for (const userId of userDirs) {
    const sessionFile = path.join(CONFIG.DATA_DIR, userId, 'session.json');
    if (fs.existsSync(sessionFile)) {
      try {
        const session = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
        userSessions.set(userId, session);
        console.log(`✅ Loaded session for user: ${session.name} (${userId})`);
      } catch (error) {
        console.error(`❌ Error loading session for ${userId}:`, error.message);
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   WHATSAPP CONNECTION MANAGER
   ═══════════════════════════════════════════════════════════ */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');

/**
 * Cleanup WhatsApp connection for a user
 */
function cleanupWhatsAppConnection(userId) {
  const instance = whatsappInstances.get(userId);
  if (instance && instance.sock) {
    try {
      instance.sock.end();
      instance.sock.removeAllListeners();
      console.log(`🧹 Cleaned up WhatsApp connection for user ID: ${userId}`);
    } catch (error) {
      console.error(`⚠️  Error cleaning up connection:`, error.message);
    }
  }
  whatsappInstances.delete(userId);
}

/**
 * Start WhatsApp connection for a user
 */
async function startWhatsAppForUser(userId) {
  const session = getUserSession(userId);
  if (!session) {
    throw new Error('User session not found');
  }
  
  // Check if reconnection is already in progress (and not exhausted)
  const existingInstance = whatsappInstances.get(userId);
  if (existingInstance && existingInstance.reconnecting) {
    // If attempts are exhausted, we should proceed with a fresh start
    if (existingInstance.reconnectAttempts >= existingInstance.maxReconnectAttempts) {
      console.log(`🔄 Reconnection exhausted, starting fresh for user: ${session.name}`);
    } else {
      console.log(`⏸️  Reconnection already in progress for user: ${session.name}`);
      return;
    }
  }
  
  // Clean up old socket if it exists
  if (existingInstance && existingInstance.sock) {
    try {
      existingInstance.sock.end();
      existingInstance.sock.removeAllListeners();
    } catch (error) {
      console.error(`⚠️  Error cleaning up old socket for ${session.name}:`, error.message);
    }
  }
  
  const authDir = path.join(CONFIG.DATA_DIR, userId, 'auth');
  const logger = pino({ level: 'silent' });
  
  console.log(`🔌 Starting WhatsApp connection for user: ${session.name}`);
  
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  
  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false, // We'll handle QR via web
    browser: ['Rindell AI', 'Chrome', '120.0'],
  });
  
  // Store instance with reconnection tracking
  // Important: Reset reconnectAttempts to 0 for fresh connection
  const instance = {
    sock,
    connected: false,
    qrCode: null,
    reconnecting: false,
    reconnectAttempts: 0, // Always start fresh at 0
    maxReconnectAttempts: 10,
    reconnectDelay: 5000,
    connectionStartTime: Date.now(), // Track when connection started
    initializing: true, // Flag to indicate we're waiting for first connection/QR
  };
  
  whatsappInstances.set(userId, instance);
  
  // Handle QR code
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      // Store QR code for web display
      instance.qrCode = qr;
      session.qrCode = qr;
      instance.initializing = false; // QR generated, no longer initializing
      console.log(`🔲 QR code generated for user: ${session.name}`);
      
      // Reset reconnect attempts on new QR code
      instance.reconnectAttempts = 0;
    }
    
    if (connection === 'open') {
      instance.connected = true;
      instance.reconnecting = false;
      instance.reconnectAttempts = 0;
      instance.initializing = false; // Successfully connected
      session.whatsappConnected = true;
      
      // Save updated session
      const userDir = path.join(CONFIG.DATA_DIR, userId);
      fs.writeFileSync(
        path.join(userDir, 'session.json'),
        JSON.stringify(session, null, 2)
      );
      
      console.log(`✅ WhatsApp connected for user: ${session.name}`);
    }
    
    if (connection === 'close') {
      instance.connected = false;
      session.whatsappConnected = false;
      
      const statusCode = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output?.statusCode
        : null;
      
      const errorMessage = lastDisconnect?.error?.message || 'Unknown error';
      const connectionDuration = Date.now() - instance.connectionStartTime;
      
      // Log detailed error information
      console.log(
        `🔌 Connection closed for user: ${session.name} ` +
        `(duration: ${Math.round(connectionDuration / 1000)}s, ` +
        `status: ${statusCode || 'none'}, ` +
        `error: ${errorMessage})`
      );
      
      // Don't reconnect if logged out
      if (statusCode === DisconnectReason.loggedOut) {
        console.log(`🚪 User logged out: ${session.name}`);
        instance.reconnecting = false;
        instance.initializing = false;
        whatsappInstances.delete(userId);
        return;
      }
      
      // If connection closes very quickly during initialization (< 3 seconds)
      // and we haven't generated a QR yet, wait longer before reconnecting
      if (instance.initializing && connectionDuration < 3000) {
        console.log(
          `⏱️  Connection closed too quickly during initialization for ${session.name}. ` +
          `Waiting 10 seconds before retry...`
        );
        instance.initializing = false; // Mark as no longer initializing
        instance.reconnectAttempts++;
        instance.reconnecting = true;
        
        setTimeout(() => {
          instance.reconnecting = false;
          startWhatsAppForUser(userId).catch(error => {
            console.error(`❌ Reconnection failed for ${session.name}:`, error.message);
            instance.reconnecting = false;
          });
        }, 10000); // Wait 10 seconds on quick failure
        return;
      }
      
      // Mark as no longer initializing
      instance.initializing = false;
      
      // Check reconnection attempts
      if (instance.reconnectAttempts >= instance.maxReconnectAttempts) {
        console.log(`❌ Max reconnection attempts reached for user: ${session.name}`);
        instance.reconnecting = false;
        return;
      }
      
      // Calculate exponential backoff delay
      const delay = instance.reconnectDelay * Math.pow(1.5, instance.reconnectAttempts);
      const maxDelay = 60000; // Max 1 minute
      const actualDelay = Math.min(delay, maxDelay);
      
      instance.reconnectAttempts++;
      instance.reconnecting = true;
      
      console.log(
        `🔄 Reconnecting WhatsApp for user: ${session.name} ` +
        `(attempt ${instance.reconnectAttempts}/${instance.maxReconnectAttempts}, ` +
        `delay: ${Math.round(actualDelay / 1000)}s)`
      );
      
      setTimeout(() => {
        instance.reconnecting = false;
        startWhatsAppForUser(userId).catch(error => {
          console.error(`❌ Reconnection failed for ${session.name}:`, error.message);
          instance.reconnecting = false;
        });
      }, actualDelay);
    }
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  // Handle incoming messages (simplified for now)
  sock.ev.on('messages.upsert', async ({ messages }) => {
    // Here you would integrate with the document processing logic
    // For now, just log
    console.log(`📨 Message received for user: ${session.name}`);
    session.documentsProcessed++;
  });
  
  return sock;
}

/* ═══════════════════════════════════════════════════════════
   WEB ROUTES
   ═══════════════════════════════════════════════════════════ */

/**
 * Landing page
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Create new user session
 */
app.post('/api/session/create', async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const session = createUserSession({ name, phone });
    
    console.log(`✨ New user registered: ${name} (${session.id})`);
    
    res.json({
      success: true,
      userId: session.id,
      session,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user session info
 */
app.get('/api/session/:userId', (req, res) => {
  const { userId } = req.params;
  const session = getUserSession(userId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(session);
});

/**
 * Start WhatsApp connection for user
 */
app.post('/api/whatsapp/connect/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const session = getUserSession(userId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if already connected
    const existing = whatsappInstances.get(userId);
    if (existing && existing.connected) {
      return res.json({
        success: true,
        message: 'Already connected',
        connected: true,
      });
    }
    
    // Check if reconnection is in progress (but not exhausted)
    if (existing && existing.reconnecting) {
      // If reconnection attempts are exhausted, force a new connection
      if (existing.reconnectAttempts >= existing.maxReconnectAttempts) {
        console.log(`🔄 Reconnection exhausted for ${session.name}, starting fresh connection`);
        cleanupWhatsAppConnection(userId);
        // Continue to start new connection
      } else {
        return res.json({
          success: true,
          message: 'Connection in progress',
          reconnecting: true,
        });
      }
    }
    
    // If there's an existing instance that's not connected, clean it up
    if (existing && !existing.connected && !existing.reconnecting) {
      console.log(`🧹 Cleaning up stale connection for ${session.name}`);
      cleanupWhatsAppConnection(userId);
    }
    
    // Start WhatsApp connection
    await startWhatsAppForUser(userId);
    
    res.json({
      success: true,
      message: 'WhatsApp connection initiated',
    });
  } catch (error) {
    console.error('Error connecting WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get QR code for user
 */
app.get('/api/whatsapp/qr/:userId', (req, res) => {
  const { userId } = req.params;
  const instance = whatsappInstances.get(userId);
  const session = getUserSession(userId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  if (!instance || !instance.qrCode) {
    return res.json({
      qrCode: null,
      connected: session.whatsappConnected || false,
    });
  }
  
  res.json({
    qrCode: instance.qrCode,
    connected: instance.connected || false,
  });
});

/**
 * Get connection status
 */
app.get('/api/whatsapp/status/:userId', (req, res) => {
  const { userId } = req.params;
  const instance = whatsappInstances.get(userId);
  const session = getUserSession(userId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    connected: (instance && instance.connected) || false,
    reconnecting: (instance && instance.reconnecting) || false,
    reconnectAttempts: (instance && instance.reconnectAttempts) || 0,
    maxReconnectAttempts: (instance && instance.maxReconnectAttempts) || 10,
    documentsProcessed: session.documentsProcessed || 0,
  });
});

/**
 * Disconnect WhatsApp for user
 */
app.post('/api/whatsapp/disconnect/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const session = getUserSession(userId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    cleanupWhatsAppConnection(userId);
    session.whatsappConnected = false;
    
    res.json({
      success: true,
      message: 'WhatsApp disconnected',
    });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List all users (admin)
 */
app.get('/api/admin/users', (req, res) => {
  const users = Array.from(userSessions.values()).map(session => ({
    id: session.id,
    name: session.name,
    phone: session.phone,
    createdAt: session.createdAt,
    whatsappConnected: session.whatsappConnected,
    documentsProcessed: session.documentsProcessed,
  }));
  
  res.json({ users, total: users.length });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Rindell AI Web Dashboard',
    users: userSessions.size,
    connections: whatsappInstances.size,
  });
});

/* ═══════════════════════════════════════════════════════════
   SERVER STARTUP
   ═══════════════════════════════════════════════════════════ */

// Load existing sessions
loadExistingSessions();

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 RINDELL AI WEB DASHBOARD                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📱 Access at: http://localhost:${PORT}`);
  console.log(`👥 Active users: ${userSessions.size}`);
  console.log(`🔌 Active connections: ${whatsappInstances.size}`);
  console.log('\n' + '─'.repeat(60));
  console.log('Ready to accept users! 🎉\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down web dashboard...');
  process.exit(0);
});
