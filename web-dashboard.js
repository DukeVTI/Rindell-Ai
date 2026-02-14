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
 * Start WhatsApp connection for a user
 */
async function startWhatsAppForUser(userId) {
  const session = getUserSession(userId);
  if (!session) {
    throw new Error('User session not found');
  }
  
  const authDir = path.join(CONFIG.DATA_DIR, userId, 'auth');
  const logger = pino({ level: 'silent' });
  
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  
  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false, // We'll handle QR via web
    browser: ['Rindell AI', 'Chrome', '120.0'],
  });
  
  // Store instance
  whatsappInstances.set(userId, {
    sock,
    connected: false,
    qrCode: null,
  });
  
  // Handle QR code
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      // Store QR code for web display
      const instance = whatsappInstances.get(userId);
      instance.qrCode = qr;
      session.qrCode = qr;
      console.log(`🔲 QR code generated for user: ${session.name}`);
    }
    
    if (connection === 'open') {
      const instance = whatsappInstances.get(userId);
      instance.connected = true;
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
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
        : true;
      
      const instance = whatsappInstances.get(userId);
      if (instance) {
        instance.connected = false;
      }
      session.whatsappConnected = false;
      
      if (shouldReconnect) {
        console.log(`🔄 Reconnecting WhatsApp for user: ${session.name}`);
        setTimeout(() => startWhatsAppForUser(userId), 5000);
      }
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
    documentsProcessed: session.documentsProcessed || 0,
  });
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
