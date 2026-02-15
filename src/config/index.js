/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║              RINDELL MVP - CONFIGURATION                  ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    apiPort: parseInt(process.env.API_PORT) || 3000,
    webPort: parseInt(process.env.WEB_PORT) || 8080,
    env: process.env.NODE_ENV || 'development',
  },

  // Database Configuration (PostgreSQL)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'rindell',
    user: process.env.DB_USER || 'rindell',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  },

  // Redis Configuration (Queue System)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
  },

  // WhatsApp Configuration
  whatsapp: {
    dataDir: process.env.WHATSAPP_DATA_DIR || './user-data',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
    maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 10,
  },

  // AI Configuration (Groq)
  ai: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
    timeout: parseInt(process.env.AI_TIMEOUT) || 120000, // 2 minutes
  },

  // Document Processing Configuration
  document: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    supportedFormats: ['pdf', 'docx', 'txt', 'doc', 'png', 'jpg', 'jpeg'],
    tempDir: process.env.TEMP_DIR || './temp',
    processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT) || 30000, // 30 seconds
  },

  // Success Metrics (Testing Requirements)
  metrics: {
    maxProcessingTime: 30000, // 30 seconds for <20 pages
    minDetectionAccuracy: 0.95, // 95%
    requiredQueueAsync: true,
    requiredSessionPersistence: true,
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  },
};

// Validate required configuration
function validateConfig() {
  const errors = [];

  if (!config.ai.apiKey || config.ai.apiKey === 'your_groq_api_key_here') {
    errors.push('GROQ_API_KEY is required');
  }

  if (config.server.env === 'production') {
    if (config.security.jwtSecret === 'change-this-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
    if (!config.database.password) {
      errors.push('DB_PASSWORD is required in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}

module.exports = {
  ...config,
  validateConfig,
};
