/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - BASIC TESTS                        ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * Basic tests for core services
 */

const config = require('../config');
const aiService = require('../services/ai');
const documentService = require('../services/document');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║         RINDELL MVP - RUNNING BASIC TESTS              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function testConfiguration() {
  console.log('📋 Test 1: Configuration Validation');
  try {
    config.validateConfig();
    console.log('✅ Configuration is valid\n');
    return true;
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    console.error('   Please check your .env file\n');
    return false;
  }
}

async function testDocumentService() {
  console.log('📄 Test 2: Document Service');
  try {
    // Test text extraction with sample text
    const sampleText = 'This is a test document for Rindell MVP.';
    const buffer = Buffer.from(sampleText);
    
    const extracted = await documentService.extractText(buffer, 'txt', 'test.txt');
    
    if (extracted.includes('test document')) {
      console.log('✅ Document service text extraction works\n');
      return true;
    } else {
      throw new Error('Extracted text does not match expected content');
    }
  } catch (error) {
    console.error('❌ Document service test failed:', error.message, '\n');
    return false;
  }
}

async function testAIService() {
  console.log('🤖 Test 3: AI Service');
  try {
    const testText = `The Role of Artificial Intelligence in Modern Healthcare

Artificial intelligence (AI) is revolutionizing healthcare delivery. Machine learning algorithms 
can now detect diseases earlier and more accurately than traditional methods. AI-powered diagnostic 
tools analyze medical images, predict patient outcomes, and recommend treatment plans.

Key applications include:
1. Early disease detection through image analysis
2. Personalized medicine based on genetic data
3. Drug discovery and development acceleration
4. Administrative task automation

The integration of AI in healthcare could save millions of lives and reduce costs by up to 30% 
in the coming decade.`;

    const result = await aiService.processDocument(testText, 'test-healthcare-doc.txt');
    
    // Validate required fields
    const requiredFields = ['title', 'executiveSummary', 'keyPoints', 'importantFacts', 'insights', 'tldr'];
    const missingFields = requiredFields.filter(field => !result[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    if (!Array.isArray(result.keyPoints) || result.keyPoints.length === 0) {
      throw new Error('keyPoints must be a non-empty array');
    }
    
    if (!Array.isArray(result.importantFacts) || result.importantFacts.length === 0) {
      throw new Error('importantFacts must be a non-empty array');
    }
    
    console.log('✅ AI service works correctly');
    console.log('   Title:', result.title);
    console.log('   Key Points:', result.keyPoints.length);
    console.log('   Important Facts:', result.importantFacts.length);
    console.log('   TLDR:', result.tldr);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ AI service test failed:', error.message);
    if (error.response) {
      console.error('   API Error:', error.response.data);
    }
    console.log('');
    return false;
  }
}

async function runTests() {
  const results = {
    config: false,
    document: false,
    ai: false,
  };

  results.config = await testConfiguration();
  
  if (results.config) {
    await documentService.initialize();
    results.document = await testDocumentService();
    results.ai = await testAIService();
  }

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                   TEST RESULTS                         ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`Configuration:    ${results.config ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Document Service: ${results.document ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`AI Service:       ${results.ai ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.config && results.document && results.ai;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Core services are working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
