/**
 * WhatsApp Message Handler
 * 
 * Processes incoming WhatsApp messages and queues documents for processing.
 */

const whatsappService = require('./index');
const queueService = require('../queue');
const db = require('../../database');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class WhatsAppMessageHandler {
  constructor() {
    this.supportedMimetypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
  }

  /**
   * Handle incoming message with potential document
   */
  async handleMessage(userId, message, fromJid) {
    const startTime = Date.now();
    
    try {
      // Extract message content
      const messageContent = message.message?.documentMessage || 
                           message.message?.imageMessage ||
                           message.message?.documentWithCaptionMessage?.documentMessage;

      if (!messageContent) {
        return; // No document
      }

      const mimetype = messageContent.mimetype || 'application/octet-stream';
      const filename = messageContent.fileName || 
                      messageContent.caption || 
                      `document_${Date.now()}`;

      console.log(`[WhatsApp Handler] Document detected: ${filename} (${mimetype})`);

      // Check if supported
      if (!this.isSupportedFormat(mimetype)) {
        await this.sendUnsupportedMessage(userId, fromJid, filename, mimetype);
        
        // Record detection for metrics
        await db.recordDocumentDetection(userId, false, 'unsupported_format');
        return;
      }

      // Record successful detection
      await db.recordDocumentDetection(userId, true, 'success');

      // Download the document
      console.log(`[WhatsApp Handler] Downloading document...`);
      const { buffer, filesize } = await whatsappService.downloadMedia(userId, message);

      // Save to temp file
      const tempDir = path.join(os.tmpdir(), 'rindell-documents');
      await fs.mkdir(tempDir, { recursive: true });
      
      const tempFilePath = path.join(tempDir, `${Date.now()}_${filename}`);
      await fs.writeFile(tempFilePath, buffer);

      console.log(`[WhatsApp Handler] Document saved: ${tempFilePath} (${filesize} bytes)`);

      // Create document record in database
      const document = await db.createDocument({
        user_id: userId,
        filename,
        filepath: tempFilePath,
        mimetype,
        filesize,
        source: 'whatsapp',
        status: 'queued',
        metadata: JSON.stringify({
          from: fromJid,
          messageId: message.key.id,
          timestamp: message.messageTimestamp,
        }),
      });

      console.log(`[WhatsApp Handler] Document created in DB: ${document.id}`);

      // Send acknowledgment to user
      await whatsappService.sendMessage(
        userId,
        fromJid,
        `📄 Document received: *${filename}*\n\n⏳ Processing your document...\n\nYou'll receive a summary shortly.`
      );

      // Queue document for processing
      await queueService.addJob('process-document', {
        documentId: document.id,
        userId,
        filepath: tempFilePath,
        filename,
        mimetype,
        fromJid, // Send summary back here
      });

      console.log(`[WhatsApp Handler] Document queued for processing: ${document.id}`);

      const processingTime = Date.now() - startTime;
      console.log(`[WhatsApp Handler] Total handling time: ${processingTime}ms`);

    } catch (error) {
      console.error(`[WhatsApp Handler] Error processing message:`, error);
      
      // Try to send error message to user
      try {
        await whatsappService.sendMessage(
          userId,
          fromJid,
          `❌ Sorry, there was an error processing your document. Please try again.`
        );
      } catch (sendError) {
        console.error(`[WhatsApp Handler] Failed to send error message:`, sendError);
      }

      // Record failed detection
      await db.recordDocumentDetection(userId, false, error.message);
    }
  }

  /**
   * Check if mimetype is supported
   */
  isSupportedFormat(mimetype) {
    return this.supportedMimetypes.includes(mimetype);
  }

  /**
   * Send unsupported format message to user
   */
  async sendUnsupportedMessage(userId, toJid, filename, mimetype) {
    const message = `❌ *Unsupported File Format*\n\n` +
      `File: ${filename}\n` +
      `Type: ${mimetype}\n\n` +
      `📋 *Supported formats:*\n` +
      `• PDF documents (.pdf)\n` +
      `• Word documents (.docx, .doc)\n` +
      `• Text files (.txt)\n` +
      `• Images (.jpg, .png)\n\n` +
      `Please send a document in one of these formats.`;

    await whatsappService.sendMessage(userId, toJid, message);
  }

  /**
   * Send summary back to user via WhatsApp
   */
  async sendSummary(userId, toJid, filename, summary) {
    try {
      // Format summary for WhatsApp
      const message = this.formatSummaryForWhatsApp(filename, summary);
      
      await whatsappService.sendMessage(userId, toJid, message);
      
      console.log(`[WhatsApp Handler] Summary sent to ${toJid}`);
    } catch (error) {
      console.error(`[WhatsApp Handler] Error sending summary:`, error);
      throw error;
    }
  }

  /**
   * Format AI summary for WhatsApp message
   */
  formatSummaryForWhatsApp(filename, summary) {
    let message = `✅ *Document Summary Complete*\n\n`;
    message += `📄 *File:* ${filename}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (summary.title) {
      message += `📋 *${summary.title}*\n\n`;
    }

    if (summary.executiveSummary) {
      message += `*Executive Summary:*\n${summary.executiveSummary}\n\n`;
    }

    if (summary.keyPoints && summary.keyPoints.length > 0) {
      message += `*Key Points:*\n`;
      summary.keyPoints.forEach(point => {
        message += `• ${point}\n`;
      });
      message += `\n`;
    }

    if (summary.importantFacts && summary.importantFacts.length > 0) {
      message += `*Important Facts:*\n`;
      summary.importantFacts.forEach(fact => {
        message += `• ${fact}\n`;
      });
      message += `\n`;
    }

    if (summary.insights) {
      message += `*Insights:*\n${summary.insights}\n\n`;
    }

    if (summary.tldr) {
      message += `*TL;DR:*\n${summary.tldr}\n\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🤖 Powered by Rindell AI`;

    return message;
  }
}

module.exports = new WhatsAppMessageHandler();
