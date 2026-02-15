#!/usr/bin/env node
/**
 * Pre-flight Check Script
 * Verifies all dependencies and requirements before starting the server
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║           RINDELL MVP - PRE-FLIGHT CHECK              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

let errors = 0;
let warnings = 0;

// Check 1: Node modules
console.log('🔍 Checking dependencies...');
const requiredModules = [
  'express',
  'cors',
  'dotenv',
  'pg',
  'redis',
  'bull',
  '@whiskeysockets/baileys',
  'bcrypt',
  'jsonwebtoken',
  'pdf-parse',
  'mammoth',
  'tesseract.js',
  'qrcode'
];

for (const module of requiredModules) {
  try {
    require.resolve(module);
    console.log(`  ✅ ${module}`);
  } catch (e) {
    console.log(`  ❌ ${module} - NOT FOUND`);
    errors++;
  }
}

if (errors > 0) {
  console.log('\n❌ MISSING DEPENDENCIES!');
  console.log('\nRun this command to fix:');
  console.log('  npm install\n');
}

// Check 2: Environment file
console.log('\n🔍 Checking environment configuration...');
if (fs.existsSync('.env')) {
  console.log('  ✅ .env file exists');
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = ['DB_PASSWORD', 'GROQ_API_KEY', 'JWT_SECRET'];
  
  for (const varName of requiredVars) {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {
      console.log(`  ✅ ${varName} is set`);
    } else {
      console.log(`  ⚠️  ${varName} needs to be configured`);
      warnings++;
    }
  }
} else {
  console.log('  ❌ .env file not found');
  console.log('     Run: cp .env.example .env');
  errors++;
}

// Check 3: Required directories
console.log('\n🔍 Checking directory structure...');
const requiredDirs = [
  'src/config',
  'src/database',
  'src/services/queue',
  'src/services/ai',
  'src/services/document',
  'src/services/whatsapp',
  'src/api',
  'public'
];

for (const dir of requiredDirs) {
  if (fs.existsSync(dir)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ❌ ${dir} - MISSING`);
    errors++;
  }
}

// Check 4: Required files
console.log('\n🔍 Checking required files...');
const requiredFiles = [
  'server.js',
  'ecosystem.config.js',
  'package.json',
  'src/config/index.js',
  'src/database/index.js',
  'src/database/schema.sql'
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    errors++;
  }
}

// Summary
console.log('\n' + '═'.repeat(60));
if (errors === 0 && warnings === 0) {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('\nYou can now start the server:');
  console.log('  pm2 start ecosystem.config.js');
  console.log('  pm2 logs rindell-mvp\n');
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠️  PASSED WITH ${warnings} WARNING(S)`);
  console.log('\nYou can start the server, but review warnings above.');
  console.log('  pm2 start ecosystem.config.js\n');
  process.exit(0);
} else {
  console.log(`❌ FAILED WITH ${errors} ERROR(S)`);
  console.log('\nFix the errors above before starting the server.\n');
  process.exit(1);
}
