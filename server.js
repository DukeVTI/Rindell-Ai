/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - MAIN SERVER                        ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * Express API server with all routes
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config');
const db = require('./src/database');
const queueService = require('./src/services/queue');
const documentService = require('./src/services/document');
const documentProcessor = require('./src/services/document/processor');
const whatsappService = require('./src/services/whatsapp');
const whatsappHandler = require('./src/services/whatsapp/handler');

// API routes
const authRoutes = require('./src/api/auth');
const documentsRoutes = require('./src/api/documents');
const metricsRoutes = require('./src/api/metrics');
const whatsappRoutes = require('./src/api/whatsapp');
const { authenticate, optionalAuth } = require('./src/api/middleware');

class Server {
  constructor() {
    this.app = express();
    this.port = config.server.apiPort;
  }

  /**
   * Initialize server
   */
  async initialize() {
    try {
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║         RINDELL MVP - INITIALIZING SERVER...          ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');

      // Validate configuration
      config.validateConfig();
      console.log('✅ Configuration validated');

      // Connect to database
      await db.connect();
      await db.initializeSchema();

      // Connect to queue
      await queueService.connect();

      // Initialize document service
      await documentService.initialize();

      // Register document processor with queue
      queueService.registerProcessor(async (jobData) => {
        return await documentProcessor.process(jobData);
      });

      // Restore WhatsApp sessions from database
      await whatsappService.restoreSessions((userId, message, fromJid) => {
        whatsappHandler.handleMessage(userId, message, fromJid).catch(err => {
          console.error('[Server] Error in WhatsApp message handler:', err);
        });
      });

      // Setup Express middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      console.log('✅ Server initialization complete\n');

    } catch (error) {
      console.error('❌ Server initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Rindell MVP API',
        version: '2.0.0',
        status: 'running',
        endpoints: {
          auth: '/api/auth',
          whatsapp: '/api/whatsapp',
          documents: '/api/documents',
          metrics: '/api/metrics',
        },
      });
    });

    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, 'public')));

    // Public routes
    this.app.use('/api/auth', authRoutes);

    // Protected routes (require authentication)
    this.app.use('/api/whatsapp', authenticate, whatsappRoutes);
    this.app.use('/api/documents', authenticate, documentsRoutes);

    // Metrics routes (optional auth for flexibility)
    this.app.use('/api/metrics', optionalAuth, metricsRoutes);

    // Test endpoint
    this.app.post('/api/test/process', authenticate, async (req, res) => {
      try {
        const { text, filename } = req.body;
        
        if (!text) {
          return res.status(400).json({ error: 'Text required' });
        }

        // Create temporary document record
        const doc = await db.createDocument(
          req.user.userId,
          filename || 'test.txt',
          'txt',
          Buffer.from(text).length,
          'test-message-id',
          'test-chat-id'
        );

        // Queue for processing
        await queueService.addDocumentJob({
          userId: req.user.userId,
          documentId: doc.id,
          filename: filename || 'test.txt',
          fileType: 'txt',
          fileBuffer: Buffer.from(text),
          messageId: 'test-message-id',
          chatId: 'test-chat-id',
        });

        res.json({
          success: true,
          message: 'Document queued for processing',
          documentId: doc.id,
        });

      } catch (error) {
        console.error('Test processing error:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Server error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: config.server.env === 'development' ? error.message : undefined,
      });
    });
  }

  /**
   * Start server
   */
  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║            🚀 RINDELL MVP SERVER READY! 🚀            ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log(`\n📡 API Server: http://localhost:${this.port}`);
        console.log(`📚 API Docs: http://localhost:${this.port}/`);
        console.log(`🔧 Environment: ${config.server.env}`);
        console.log(`\n✨ Ready to process documents!\n`);
        resolve();
      });
    });
  }

  /**
   * Stop server gracefully
   */
  async stop() {
    console.log('\n🛑 Shutting down server...');

    // Disconnect WhatsApp sessions
    await whatsappService.shutdown();

    // Close server
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
    }

    // Close queue
    await queueService.close();

    // Close database
    await db.close();

    console.log('✅ Server shut down gracefully\n');
  }
}

// Create and export server instance
const server = new Server();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});

// Start server if called directly
if (require.main === module) {
  server.initialize()
    .then(() => server.start())
    .catch((error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });
}

module.exports = server;
