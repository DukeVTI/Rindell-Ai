/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - DOCUMENT PROCESSOR                 ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * Orchestrates the complete document processing pipeline
 * SUCCESS METRIC: ≤ 30 seconds for documents < 20 pages
 */

const db = require('../../database');
const documentService = require('../document');
const aiService = require('../ai');
const whatsappHandler = require('../whatsapp/handler');
const config = require('../../config');
const fs = require('fs').promises;

class DocumentProcessor {
  /**
   * Process a document through the complete pipeline
   * @param {Object} jobData - Data from queue
   * @returns {Promise<Object>} Processing result
   */
  async process(jobData) {
    const {
      userId,
      documentId,
      filename,
      filepath,
      mimetype,
      fromJid, // WhatsApp JID to send summary back to
    } = jobData;

    const startTime = Date.now();
    const metrics = [];

    try {
      console.log(`\n╔════════════════════════════════════════════════════════╗`);
      console.log(`║  Processing Document: ${filename}`);
      console.log(`╚════════════════════════════════════════════════════════╝`);

      // Update status to processing
      await db.updateDocumentStatus(documentId, 'processing');

      // Stage 1: Text Extraction
      const extractStart = Date.now();
      console.log('\n📄 Stage 1: Text Extraction');
      
      // Read file from filepath
      const fileBuffer = await fs.readFile(filepath);
      
      const text = await documentService.extractText(
        fileBuffer,
        mimetype,
        filename
      );

      const extractDuration = Date.now() - extractStart;
      metrics.push({
        stage: 'extraction',
        duration: extractDuration,
        success: true,
      });

      console.log(`✅ Extraction complete: ${text.length} characters`);

      // Stage 2: AI Processing
      const aiStart = Date.now();
      console.log('\n🤖 Stage 2: AI Processing');
      
      const summary = await aiService.processDocument(text, filename);

      const aiDuration = Date.now() - aiStart;
      metrics.push({
        stage: 'ai_processing',
        duration: aiDuration,
        success: true,
      });

      console.log(`✅ AI processing complete`);

      // Stage 3: Save to Database
      const dbStart = Date.now();
      console.log('\n💾 Stage 3: Database Storage');
      
      await db.createSummary(documentId, summary);
      await db.updateDocumentStatus(documentId, 'completed');

      const dbDuration = Date.now() - dbStart;
      metrics.push({
        stage: 'database_storage',
        duration: dbDuration,
        success: true,
      });

      console.log(`✅ Summary saved to database`);

      // Stage 4: Send to WhatsApp (if fromJid provided)
      if (fromJid) {
        console.log('\n📱 Stage 4: Sending Summary to WhatsApp');
        
        try {
          await whatsappHandler.sendSummary(userId, fromJid, filename, summary);
          console.log(`✅ Summary sent to WhatsApp: ${fromJid}`);
        } catch (whatsappError) {
          console.error('⚠️  Failed to send WhatsApp message:', whatsappError.message);
          // Don't fail the whole job if WhatsApp send fails
        }
      }

      // Clean up temp file
      try {
        await fs.unlink(filepath);
        console.log(`🗑️  Temp file cleaned up: ${filepath}`);
      } catch (cleanupError) {
        console.error('⚠️  Failed to clean up temp file:', cleanupError.message);
      }

      // Calculate total processing time
      const totalDuration = Date.now() - startTime;

      // Record metrics
      for (const metric of metrics) {
        await db.query(`
          INSERT INTO processing_metrics (document_id, stage, started_at, completed_at, duration, success)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          documentId,
          metric.stage,
          new Date(Date.now() - metric.duration),
          new Date(),
          metric.duration,
          metric.success
        ]);
      }

      // Record system metric for processing time
      await db.recordMetric('processing_time', totalDuration, {
        documentId,
        filename,
        mimetype,
        textLength: text.length,
        success: true,
      });

      // Check if we met the 30-second requirement
      const meetsRequirement = totalDuration <= config.metrics.maxProcessingTime;
      
      console.log(`\n╔════════════════════════════════════════════════════════╗`);
      console.log(`║  Processing Complete: ${totalDuration}ms`);
      console.log(`║  Target: ${config.metrics.maxProcessingTime}ms`);
      console.log(`║  Status: ${meetsRequirement ? '✅ PASSED' : '⚠️  EXCEEDED'}`);
      console.log(`╚════════════════════════════════════════════════════════╝\n`);

      return {
        success: true,
        documentId,
        filename,
        totalDuration,
        meetsRequirement,
        summary,
        metrics,
      };

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      
      console.error(`\n❌ Processing failed after ${totalDuration}ms:`, error.message);

      // Update database
      await db.updateDocumentStatus(documentId, 'failed', error.message);

      // Record failure metric
      await db.recordMetric('processing_time', totalDuration, {
        documentId,
        filename,
        fileType,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Generate unsupported file error message for WhatsApp
   * @param {string} filename
   * @param {string} fileType
   * @returns {string}
   */
  generateUnsupportedMessage(filename, fileType) {
    return `⚠️ *Unsupported File Format*\n\n` +
      `I cannot process "${filename}" because ${fileType ? `".${fileType}"` : 'this'} files are not supported.\n\n` +
      `*Supported formats:*\n` +
      `• PDF documents (.pdf)\n` +
      `• Word documents (.docx, .doc)\n` +
      `• Text files (.txt)\n` +
      `• Images (.png, .jpg, .jpeg) - with OCR\n\n` +
      `Please send your document in one of these formats.`;
  }

  /**
   * Generate error message for WhatsApp
   * @param {string} filename
   * @param {Error} error
   * @returns {string}
   */
  generateErrorMessage(filename, error) {
    return `❌ *Processing Error*\n\n` +
      `I encountered an error while processing "${filename}".\n\n` +
      `*Error:* ${error.message}\n\n` +
      `Please try:\n` +
      `• Sending the file again\n` +
      `• Checking if the file is corrupted\n` +
      `• Converting to a different format\n\n` +
      `If the problem persists, contact support.`;
  }
}

// Singleton instance
const documentProcessor = new DocumentProcessor();

module.exports = documentProcessor;
