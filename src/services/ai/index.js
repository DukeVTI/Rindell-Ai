/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - AI SERVICE (GROQ)                  ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * AI processing with STRICT output format
 * SUCCESS METRIC: 100% output format compliance
 */

const axios = require('axios');
const config = require('../config');

class AIService {
  constructor() {
    this.apiKey = config.ai.apiKey;
    this.model = config.ai.model;
    this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';
  }

  /**
   * STRICT OUTPUT FORMAT TEMPLATE
   * This format is NON-NEGOTIABLE per requirements
   */
  getSystemPrompt() {
    return `You are a professional document analysis assistant. You MUST respond ONLY with valid JSON in this EXACT format:

{
  "title": "Brief document title (max 100 chars)",
  "executiveSummary": "Comprehensive 2-3 paragraph summary of the entire document",
  "keyPoints": [
    "First key point from the document",
    "Second key point from the document",
    "Third key point from the document"
  ],
  "importantFacts": [
    "Critical fact or data point #1",
    "Critical fact or data point #2",
    "Critical fact or data point #3"
  ],
  "insights": "Analysis of implications, significance, or actionable takeaways from the document",
  "tldr": "One-sentence ultra-concise summary (max 150 chars)"
}

RULES:
1. Response must be valid JSON only - no markdown, no extra text
2. All fields are REQUIRED
3. Arrays must have at least 3 items, preferably 5-7
4. Be professional, concise, and structured
5. Focus on accuracy and relevance
6. Extract dates, numbers, and key facts precisely`;
  }

  /**
   * Process document text with AI
   * @param {string} text - Extracted document text
   * @param {string} filename - Original filename for context
   * @returns {Promise<Object>} Structured summary
   */
  async processDocument(text, filename = 'document') {
    const startTime = Date.now();

    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error('Document text is empty');
      }

      // Truncate very long documents to avoid token limits
      const maxChars = 50000; // ~12,500 tokens
      const truncatedText = text.length > maxChars 
        ? text.substring(0, maxChars) + '\n\n[Document truncated due to length...]'
        : text;

      console.log(`🤖 Processing with AI: ${filename} (${truncatedText.length} chars)`);

      // Call Groq API
      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: `Analyze this document titled "${filename}":\n\n${truncatedText}`
            }
          ],
          temperature: config.ai.temperature,
          max_tokens: config.ai.maxTokens,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: config.ai.timeout,
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      // Parse and validate JSON response
      let summary;
      try {
        // Try to extract JSON if wrapped in markdown
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
        summary = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('❌ AI response is not valid JSON:', aiResponse);
        throw new Error('AI returned invalid JSON format');
      }

      // Validate required fields
      const requiredFields = ['title', 'executiveSummary', 'keyPoints', 'importantFacts', 'insights', 'tldr'];
      const missingFields = requiredFields.filter(field => !summary[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`AI response missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate array fields
      if (!Array.isArray(summary.keyPoints) || summary.keyPoints.length < 1) {
        throw new Error('keyPoints must be an array with at least 1 item');
      }
      if (!Array.isArray(summary.importantFacts) || summary.importantFacts.length < 1) {
        throw new Error('importantFacts must be an array with at least 1 item');
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ AI processing complete in ${processingTime}ms`);

      return {
        ...summary,
        metadata: {
          model: this.model,
          processingTime,
          tokensUsed: response.data.usage?.total_tokens || 0,
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ AI processing failed after ${processingTime}ms:`, error.message);
      
      if (error.response) {
        console.error('API Error:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Format summary for WhatsApp message
   * @param {Object} summary - Structured summary from AI
   * @returns {string} Formatted text for WhatsApp
   */
  formatForWhatsApp(summary) {
    let message = `📄 *${summary.title}*\n\n`;
    
    message += `📝 *Executive Summary*\n${summary.executiveSummary}\n\n`;
    
    message += `🔑 *Key Points*\n`;
    summary.keyPoints.forEach((point, i) => {
      message += `${i + 1}. ${point}\n`;
    });
    message += '\n';
    
    message += `💡 *Important Facts*\n`;
    summary.importantFacts.forEach((fact, i) => {
      message += `• ${fact}\n`;
    });
    message += '\n';
    
    message += `🎯 *Insights*\n${summary.insights}\n\n`;
    
    message += `⚡ *TL;DR*\n${summary.tldr}`;
    
    return message;
  }

  /**
   * Test AI connection and format compliance
   */
  async test() {
    try {
      const testText = `This is a test document about artificial intelligence and machine learning. 
      AI is transforming industries worldwide. Machine learning enables computers to learn from data.
      Deep learning uses neural networks. The future of AI is promising with applications in healthcare,
      finance, and autonomous vehicles.`;
      
      const result = await this.processDocument(testText, 'test-document.txt');
      console.log('✅ AI Service test successful');
      console.log('Sample output:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('❌ AI Service test failed:', error.message);
      throw error;
    }
  }
}

// Singleton instance
const aiService = new AIService();

module.exports = aiService;
