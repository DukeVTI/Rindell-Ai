#!/usr/bin/env node

/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║      RINDELL AI - ALL-IN-ONE PLATFORM LAUNCHER           ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * Starts both API server and Web dashboard together
 * Perfect for running the complete platform
 */

const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         🚀 RINDELL AI PLATFORM - STARTING...             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const API_PORT = process.env.API_PORT || 3000;
const WEB_PORT = process.env.WEB_PORT || 8080;

// Check if Groq API key is set
if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                ⚠️  GROQ API KEY NOT SET                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n❌ Error: GROQ_API_KEY environment variable is required!\n');
  console.log('Please set it in .env file:');
  console.log('  1. Copy .env.example to .env');
  console.log('  2. Add your Groq API key from https://console.groq.com');
  console.log('  3. Set: GROQ_API_KEY=gsk_your_actual_key_here\n');
  process.exit(1);
}

// Start API Server
console.log('📡 Starting API Server...');
const apiServer = spawn('node', ['api-server.js'], {
  cwd: __dirname,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env }
});

// Start Web Dashboard
console.log('🌐 Starting Web Dashboard...');
const webServer = spawn('node', ['web-dashboard.js'], {
  cwd: __dirname,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env }
});

// Handle API Server output
apiServer.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.trim()) {
    console.log(`[API] ${output.trim()}`);
  }
});

apiServer.stderr.on('data', (data) => {
  const output = data.toString();
  if (output.trim()) {
    console.error(`[API ERROR] ${output.trim()}`);
  }
});

// Handle Web Server output
webServer.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.trim()) {
    console.log(`[WEB] ${output.trim()}`);
  }
});

webServer.stderr.on('data', (data) => {
  const output = data.toString();
  if (output.trim()) {
    console.error(`[WEB ERROR] ${output.trim()}`);
  }
});

// Handle process exits
apiServer.on('close', (code) => {
  console.log(`\n[API] Server exited with code ${code}`);
  webServer.kill();
  process.exit(code);
});

webServer.on('close', (code) => {
  console.log(`\n[WEB] Server exited with code ${code}`);
  apiServer.kill();
  process.exit(code);
});

// Wait for servers to start
setTimeout(() => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║            ✅ RINDELL AI PLATFORM IS READY!               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`📱 Web Dashboard: http://localhost:${WEB_PORT}`);
  console.log(`📡 API Server:    http://localhost:${API_PORT}`);
  console.log('\n' + '─'.repeat(60));
  console.log('👥 Users can now visit the web dashboard to connect!');
  console.log('🎉 No terminal needed - everything through the browser!');
  console.log('\n' + '─'.repeat(60));
  console.log('\nPress Ctrl+C to stop all services\n');
}, 3000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Rindell AI Platform...');
  apiServer.kill('SIGINT');
  webServer.kill('SIGINT');
  setTimeout(() => {
    console.log('✅ All services stopped\n');
    process.exit(0);
  }, 1000);
});

process.on('SIGTERM', () => {
  apiServer.kill('SIGTERM');
  webServer.kill('SIGTERM');
  process.exit(0);
});
