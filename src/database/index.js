/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - DATABASE CONNECTION                ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const { Pool } = require('pg');
const config = require('../config');
const fs = require('fs');
const path = require('path');

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = new Pool({
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        user: config.database.user,
        password: config.database.password,
        ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('✅ Database connected successfully');
      client.release();

      return this.pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async initializeSchema() {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await this.pool.query(schema);
      console.log('✅ Database schema initialized');
    } catch (error) {
      console.error('❌ Schema initialization failed:', error.message);
      throw error;
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`🔍 Query executed in ${duration}ms`);
      return res;
    } catch (error) {
      console.error('❌ Query error:', error.message);
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ Database connection closed');
    }
  }

  // User queries
  async createUser(fullName, email, phoneNumber, passwordHash) {
    const query = `
      INSERT INTO users (full_name, email, phone_number, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, phone_number, created_at
    `;
    const result = await this.query(query, [fullName, email, phoneNumber, passwordHash]);
    return result.rows[0];
  }

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.query(query, [email]);
    return result.rows[0];
  }

  async getUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async updateUserWhatsAppStatus(userId, connected, sessionId = null) {
    const query = `
      UPDATE users 
      SET whatsapp_connected = $1, whatsapp_session_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.query(query, [connected, sessionId, userId]);
    return result.rows[0];
  }

  // Document queries
  async createDocument(userId, filename, fileType, fileSize, messageId, chatId) {
    const query = `
      INSERT INTO documents (user_id, filename, file_type, file_size, message_id, chat_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await this.query(query, [userId, filename, fileType, fileSize, messageId, chatId]);
    return result.rows[0];
  }

  async updateDocumentStatus(documentId, status, errorMessage = null) {
    const query = `
      UPDATE documents 
      SET status = $1, error_message = $2, 
          processed_at = CASE WHEN $1 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE processed_at END,
          processing_duration = CASE WHEN $1 = 'completed' THEN 
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - uploaded_at)) * 1000 
          ELSE processing_duration END
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.query(query, [status, errorMessage, documentId]);
    return result.rows[0];
  }

  // Summary queries
  async createSummary(documentId, summaryData) {
    const query = `
      INSERT INTO summaries (
        document_id, title, executive_summary, key_points, 
        important_facts, insights, tldr, full_response
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await this.query(query, [
      documentId,
      summaryData.title,
      summaryData.executiveSummary,
      JSON.stringify(summaryData.keyPoints),
      JSON.stringify(summaryData.importantFacts),
      summaryData.insights,
      summaryData.tldr,
      JSON.stringify(summaryData),
    ]);
    return result.rows[0];
  }

  // Metrics queries
  async recordMetric(metricType, value, metadata = {}) {
    const query = `
      INSERT INTO system_metrics (metric_type, metric_value, metadata)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.query(query, [metricType, value, JSON.stringify(metadata)]);
    return result.rows[0];
  }

  async getMetrics(metricType, startDate = null, endDate = null) {
    let query = 'SELECT * FROM system_metrics WHERE metric_type = $1';
    const params = [metricType];
    
    if (startDate) {
      query += ' AND recorded_at >= $2';
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND recorded_at <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    query += ' ORDER BY recorded_at DESC';
    const result = await this.query(query, params);
    return result.rows;
  }
}

// Singleton instance
const db = new Database();

module.exports = db;
