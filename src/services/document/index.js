/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - DOCUMENT SERVICE                   ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * Document text extraction from multiple formats
 * SUCCESS METRIC: Support PDF, DOCX, TXT, images with OCR
 */

const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const config = require('../config');

class DocumentService {
  constructor() {
    this.tempDir = config.document.tempDir;
    this.supportedFormats = config.document.supportedFormats;
    this.maxFileSize = config.document.maxFileSize;
  }

  /**
   * Initialize temp directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log(`✅ Document service initialized (temp: ${this.tempDir})`);
    } catch (error) {
      console.error('❌ Failed to initialize document service:', error.message);
      throw error;
    }
  }

  /**
   * Detect document type from filename
   * @param {string} filename
   * @returns {string|null} File type or null if unsupported
   */
  detectFileType(filename) {
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    return this.supportedFormats.includes(ext) ? ext : null;
  }

  /**
   * Extract text from document buffer
   * @param {Buffer} buffer - File content
   * @param {string} fileType - File extension (pdf, docx, txt, jpg, png)
   * @param {string} filename - Original filename
   * @returns {Promise<string>} Extracted text
   */
  async extractText(buffer, fileType, filename = 'document') {
    const startTime = Date.now();

    try {
      console.log(`📄 Extracting text from ${fileType.toUpperCase()}: ${filename}`);

      // Validate file size
      if (buffer.length > this.maxFileSize) {
        throw new Error(`File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (max: ${this.maxFileSize / 1024 / 1024}MB)`);
      }

      let text = '';

      switch (fileType.toLowerCase()) {
        case 'pdf':
          text = await this.extractFromPDF(buffer);
          break;
        
        case 'docx':
        case 'doc':
          text = await this.extractFromDOCX(buffer);
          break;
        
        case 'txt':
          text = buffer.toString('utf-8');
          break;
        
        case 'png':
        case 'jpg':
        case 'jpeg':
          text = await this.extractFromImage(buffer);
          break;
        
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Clean extracted text
      text = this.cleanText(text);

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from document');
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Text extracted (${text.length} chars) in ${duration}ms`);

      return text;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Text extraction failed after ${duration}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Extract text from PDF
   */
  async extractFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX
   */
  async extractFromDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractFromImage(buffer) {
    try {
      console.log('🔍 Running OCR on image...');
      
      const { data: { text } } = await Tesseract.recognize(
        buffer,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      return text;
    } catch (error) {
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    if (!text) return '';

    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  /**
   * Save buffer to temp file
   * @param {Buffer} buffer
   * @param {string} filename
   * @returns {Promise<string>} Temp file path
   */
  async saveTempFile(buffer, filename) {
    const tempPath = path.join(this.tempDir, `${Date.now()}-${filename}`);
    await fs.writeFile(tempPath, buffer);
    console.log(`💾 Saved temp file: ${tempPath}`);
    return tempPath;
  }

  /**
   * Delete temp file
   * @param {string} filePath
   */
  async deleteTempFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️  Deleted temp file: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️  Could not delete temp file: ${error.message}`);
    }
  }

  /**
   * Clean up old temp files
   */
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      let cleaned = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} old temp files`);
      }
    } catch (error) {
      console.warn(`⚠️  Temp cleanup error: ${error.message}`);
    }
  }

  /**
   * Get file info from buffer
   * @param {Buffer} buffer
   * @param {string} filename
   * @returns {Object}
   */
  getFileInfo(buffer, filename) {
    const fileType = this.detectFileType(filename);
    const fileSize = buffer.length;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

    return {
      filename,
      fileType,
      fileSize,
      fileSizeMB: `${fileSizeMB}MB`,
      isSupported: fileType !== null,
      isTooLarge: fileSize > this.maxFileSize,
    };
  }
}

// Singleton instance
const documentService = new DocumentService();

module.exports = documentService;
