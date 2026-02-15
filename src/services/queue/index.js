/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - QUEUE SERVICE (REDIS + BULL)       ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * Async document processing queue
 * SUCCESS METRIC: Processing must be async, non-blocking
 */

const Queue = require('bull');
const config = require('../config');

class QueueService {
  constructor() {
    this.documentQueue = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection and create queue
   */
  async connect() {
    try {
      // Create document processing queue
      this.documentQueue = new Queue('document-processing', {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password || undefined,
          db: config.redis.db,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500, // Keep last 500 failed jobs for debugging
        },
      });

      // Test connection
      await this.documentQueue.isReady();
      this.isConnected = true;
      console.log('✅ Queue service connected (Redis + Bull)');

      // Setup event listeners for monitoring
      this.setupEventListeners();

      return this.documentQueue;
    } catch (error) {
      console.error('❌ Queue service connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Setup event listeners for queue monitoring
   */
  setupEventListeners() {
    this.documentQueue.on('active', (job) => {
      console.log(`📋 Processing job ${job.id}: ${job.data.filename}`);
    });

    this.documentQueue.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed in ${result.duration}ms`);
    });

    this.documentQueue.on('failed', (job, error) => {
      console.error(`❌ Job ${job.id} failed:`, error.message);
    });

    this.documentQueue.on('stalled', (job) => {
      console.warn(`⚠️  Job ${job.id} stalled`);
    });
  }

  /**
   * Add document to processing queue
   * @param {Object} data - Document data
   * @param {number} data.userId - User ID
   * @param {number} data.documentId - Document ID in database
   * @param {string} data.filename - Filename
   * @param {string} data.fileType - File type (pdf, docx, txt, etc)
   * @param {Buffer} data.fileBuffer - File content
   * @param {string} data.messageId - WhatsApp message ID
   * @param {string} data.chatId - WhatsApp chat ID
   * @returns {Promise<Job>}
   */
  async addDocumentJob(data) {
    try {
      const job = await this.documentQueue.add('process-document', data, {
        priority: 1,
        timeout: config.document.processingTimeout,
      });

      console.log(`📨 Document queued: ${data.filename} (Job ID: ${job.id})`);
      return job;
    } catch (error) {
      console.error('❌ Failed to queue document:', error.message);
      throw error;
    }
  }

  /**
   * Register processor function for document jobs
   * @param {Function} processor - Async function to process jobs
   */
  registerProcessor(processor) {
    if (!this.documentQueue) {
      throw new Error('Queue not initialized. Call connect() first.');
    }

    this.documentQueue.process('process-document', async (job) => {
      const startTime = Date.now();
      
      try {
        const result = await processor(job.data);
        const duration = Date.now() - startTime;
        
        return {
          ...result,
          duration,
          jobId: job.id,
        };
      } catch (error) {
        console.error(`❌ Processor error for job ${job.id}:`, error);
        throw error;
      }
    });

    console.log('✅ Document processor registered');
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    if (!this.documentQueue) {
      return null;
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.documentQueue.getWaitingCount(),
      this.documentQueue.getActiveCount(),
      this.documentQueue.getCompletedCount(),
      this.documentQueue.getFailedCount(),
      this.documentQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    if (!this.documentQueue) {
      return null;
    }
    return await this.documentQueue.getJob(jobId);
  }

  /**
   * Clean old jobs (maintenance)
   */
  async cleanOldJobs(grace = 24 * 60 * 60 * 1000) {
    if (!this.documentQueue) {
      return;
    }

    await this.documentQueue.clean(grace, 'completed');
    await this.documentQueue.clean(grace, 'failed');
    console.log(`🧹 Cleaned jobs older than ${grace / 1000}s`);
  }

  /**
   * Close queue connection
   */
  async close() {
    if (this.documentQueue) {
      await this.documentQueue.close();
      this.isConnected = false;
      console.log('✅ Queue service closed');
    }
  }
}

// Singleton instance
const queueService = new QueueService();

module.exports = queueService;
