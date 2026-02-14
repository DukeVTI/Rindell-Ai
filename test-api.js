#!/usr/bin/env node

/**
 * Simple test script for API server
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = process.env.API_SERVER_URL || 'http://localhost:3000';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           RINDELL AI API SERVER TEST                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function testHealth() {
  console.log('1️⃣  Testing health endpoint...');
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check passed:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testTextFile() {
  console.log('\n2️⃣  Testing with sample text file...');
  try {
    // Create a sample text file
    const content = 'This is a test document for Rindell AI.\n\nIt contains sample text to verify the API server is working correctly.\n\nKey points:\n1. Text extraction\n2. AI analysis\n3. Summary generation';
    
    const form = new FormData();
    form.append('file', Buffer.from(content), {
      filename: 'test.txt',
      contentType: 'text/plain'
    });
    form.append('filename', 'test.txt');
    form.append('mimeType', 'text/plain');
    form.append('source', 'test@c.us');
    form.append('size', content.length.toString());
    
    console.log('📤 Sending test document...');
    const response = await axios.post(`${API_URL}/analyze`, form, {
      headers: form.getHeaders(),
      timeout: 60000
    });
    
    console.log('✅ Document analysis successful!');
    console.log('\n📊 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Document test failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log(`Testing API at: ${API_URL}\n`);
  console.log('─'.repeat(60));
  
  const healthOk = await testHealth();
  
  if (!healthOk) {
    console.log('\n❌ API server is not responding. Make sure it\'s running:');
    console.log('   npm run api\n');
    return;
  }
  
  console.log('\n─'.repeat(60));
  
  const testOk = await testTextFile();
  
  console.log('\n' + '─'.repeat(60));
  console.log('\n📋 Test Summary:');
  console.log(`   Health Check: ${healthOk ? '✅ Passed' : '❌ Failed'}`);
  console.log(`   Document Test: ${testOk ? '✅ Passed' : '❌ Failed'}`);
  
  if (healthOk && testOk) {
    console.log('\n🎉 All tests passed! API server is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the API server configuration.\n');
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test script error:', error.message);
  process.exit(1);
});
