/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL AI - DOCUMENT ANALYSIS API SERVER       ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * Self-hosted replacement for Make.com webhook
 * Uses Groq AI for document analysis
 */

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

/* ═══════════════════════════════════════════════════════════
   CONFIGURATION
   ═══════════════════════════════════════════════════════════ */

const CONFIG = {
  PORT: process.env.API_PORT || 3000,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
  MAX_TEXT_LENGTH: 30000, // Characters to send to AI
};

// Validate configuration
if (!CONFIG.GROQ_API_KEY) {
  console.error('❌ ERROR: GROQ_API_KEY environment variable is required!');
  console.error('Please set it in .env file or export GROQ_API_KEY=your_key');
  process.exit(1);
}

/* ═══════════════════════════════════════════════════════════
   TEXT EXTRACTION FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

/**
 * Extract text from PDF buffer
 */
async function extractPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from Word document buffer (.docx)
 */
async function extractWord(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Word extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from Excel spreadsheet buffer
 */
async function extractExcel(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      text += `\n=== Sheet: ${sheetName} ===\n`;
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      text += csv + '\n';
    });
    
    return text;
  } catch (error) {
    throw new Error(`Excel extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from PowerPoint (.pptx)
 */
async function extractPowerPoint(buffer) {
  try {
    // For PowerPoint, we'll use mammoth's raw text extraction
    // Note: This is a simplified approach. For better results, 
    // consider using a dedicated PPTX library
    const result = await mammoth.extractRawText({ buffer });
    return result.value || 'PowerPoint content detected but text extraction limited.';
  } catch (error) {
    throw new Error(`PowerPoint extraction failed: ${error.message}`);
  }
}

/**
 * Extract text based on MIME type
 */
async function extractText(buffer, mimeType, filename) {
  console.log(`📄 Extracting text from ${mimeType}...`);
  
  let text = '';
  
  switch (mimeType) {
    case 'application/pdf':
      text = await extractPDF(buffer);
      break;
      
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      text = await extractWord(buffer);
      break;
      
    case 'application/msword':
      text = await extractWord(buffer);
      break;
      
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      text = await extractPowerPoint(buffer);
      break;
      
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      text = await extractExcel(buffer);
      break;
      
    case 'text/plain':
      text = buffer.toString('utf-8');
      break;
      
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
  
  console.log(`✅ Extracted ${text.length} characters`);
  return text;
}

/* ═══════════════════════════════════════════════════════════
   AI ANALYSIS WITH GROQ
   ═══════════════════════════════════════════════════════════ */

/**
 * Analyze document text with Groq AI
 */
async function analyzeWithGroq(text, filename, mimeType) {
  console.log(`🤖 Sending to Groq AI for analysis...`);
  
  // Truncate text if too long
  const truncatedText = text.length > CONFIG.MAX_TEXT_LENGTH 
    ? text.substring(0, CONFIG.MAX_TEXT_LENGTH) + '\n\n[Document truncated due to length...]'
    : text;
  
  const prompt = `You are a professional document analysis assistant. Analyze the following document and provide a comprehensive, well-structured summary.

Document Type: ${mimeType}
Filename: ${filename}

Please provide:
1. Document Overview - What is this document about?
2. Key Points - List the main points, findings, or content
3. Important Details - Any critical data, numbers, or conclusions
4. Summary - A concise overall summary

Format your response clearly with headers and bullet points where appropriate.

DOCUMENT CONTENT:
${truncatedText}`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: CONFIG.GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert document analyst. Provide clear, structured, and comprehensive summaries of documents.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds
      }
    );
    
    const summary = response.data.choices[0].message.content;
    console.log(`✅ AI analysis complete (${summary.length} characters)`);
    
    return summary;
  } catch (error) {
    console.error('❌ Groq API error:', error.response?.data || error.message);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

/* ═══════════════════════════════════════════════════════════
   API ENDPOINTS
   ═══════════════════════════════════════════════════════════ */

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Rindell AI Document Analysis API',
    groq_configured: !!CONFIG.GROQ_API_KEY,
    model: CONFIG.GROQ_MODEL
  });
});

/**
 * Main document analysis endpoint
 */
app.post('/analyze', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              NEW DOCUMENT ANALYSIS REQUEST                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    // Validate request
    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ 
        error: 'No file provided',
        summary: 'Error: No file uploaded' 
      });
    }
    
    const { filename, mimeType, source, size } = req.body;
    const buffer = req.file.buffer;
    
    console.log(`📄 File: ${filename || req.file.originalname}`);
    console.log(`📦 Size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`📋 Type: ${mimeType || req.file.mimetype}`);
    console.log(`👤 From: ${source || 'unknown'}`);
    
    // Extract text from document
    const text = await extractText(
      buffer, 
      mimeType || req.file.mimetype,
      filename || req.file.originalname
    );
    
    if (!text || text.trim().length < 10) {
      throw new Error('Document appears to be empty or unreadable');
    }
    
    // Analyze with Groq AI
    const summary = await analyzeWithGroq(
      text,
      filename || req.file.originalname,
      mimeType || req.file.mimetype
    );
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Processing complete in ${processingTime}s`);
    console.log('─'.repeat(60));
    
    // Return summary
    res.json({ 
      summary,
      metadata: {
        filename: filename || req.file.originalname,
        size: buffer.length,
        mimeType: mimeType || req.file.mimetype,
        processingTime: `${processingTime}s`,
        textLength: text.length,
        model: CONFIG.GROQ_MODEL
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing document:', error.message);
    console.error(error.stack);
    console.log('─'.repeat(60));
    
    res.status(500).json({ 
      error: error.message,
      summary: `Error analyzing document: ${error.message}\n\nPlease try again or contact support if the issue persists.`
    });
  }
});

/* ═══════════════════════════════════════════════════════════
   START SERVER
   ═══════════════════════════════════════════════════════════ */

app.listen(CONFIG.PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        🤖 RINDELL AI DOCUMENT ANALYSIS API SERVER         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Server running on port ${CONFIG.PORT}`);
  console.log(`🤖 Using Groq AI model: ${CONFIG.GROQ_MODEL}`);
  console.log(`📡 Endpoint: http://localhost:${CONFIG.PORT}/analyze`);
  console.log(`💚 Health check: http://localhost:${CONFIG.PORT}/health`);
  console.log('\n' + '─'.repeat(60));
  console.log('Ready to process documents! 📄\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down API server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down API server...');
  process.exit(0);
});
