#!/usr/bin/env node

/**
 * Rindell AI - Deployment Diagnostics Tool
 * 
 * Quickly diagnose why the app won't start
 * 
 * Usage: node diagnose.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       RINDELL AI - DEPLOYMENT DIAGNOSTICS             ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

let issuesFound = 0;
let criticalIssues = 0;

// Helper functions
function check(description) {
  process.stdout.write(`🔍 ${description}... `);
}

function pass(message) {
  console.log(`✅ ${message || 'OK'}`);
}

function fail(message) {
  console.log(`❌ ${message}`);
  issuesFound++;
}

function critical(message) {
  console.log(`🚨 CRITICAL: ${message}`);
  criticalIssues++;
  issuesFound++;
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (error) {
    return null;
  }
}

// Check 1: node_modules exists
check('Checking if node_modules directory exists');
if (fs.existsSync('./node_modules')) {
  const moduleCount = fs.readdirSync('./node_modules').length;
  if (moduleCount > 100) {
    pass(`Found ${moduleCount} modules`);
  } else if (moduleCount > 0) {
    fail(`Only ${moduleCount} modules (expected 600+)`);
    console.log('   → Run: rm -rf node_modules && npm install');
  } else {
    critical('node_modules exists but is EMPTY!');
    console.log('   → Run: rm -rf node_modules && npm install');
  }
} else {
  critical('node_modules directory does NOT exist!');
  console.log('   → Read: NODE-MODULES-MISSING.txt');
  console.log('   → Run: npm install');
}

// Check 2: Critical modules exist
const criticalModules = ['express', 'dotenv', 'cors', 'pg', 'redis', '@whiskeysockets/baileys'];
check('Checking critical npm modules');
const missingModules = [];
criticalModules.forEach(mod => {
  const modPath = path.join('./node_modules', mod);
  if (!fs.existsSync(modPath)) {
    missingModules.push(mod);
  }
});
if (missingModules.length === 0) {
  pass('All critical modules found');
} else {
  critical(`Missing modules: ${missingModules.join(', ')}`);
  console.log('   → Run: npm install');
}

// Check 3: .env file
check('Checking .env file');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const requiredVars = ['DB_PASSWORD', 'GROQ_API_KEY', 'JWT_SECRET'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName + '=') || envContent.includes(varName + '=\n') || envContent.includes(varName + '=your_')) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length === 0) {
    pass('All required variables configured');
  } else {
    fail(`Missing or unconfigured: ${missingVars.join(', ')}`);
    console.log('   → Edit .env and set these variables');
  }
} else {
  fail('.env file not found');
  console.log('   → Run: cp .env.example .env');
  console.log('   → Then edit .env with your values');
}

// Check 4: PostgreSQL
check('Checking PostgreSQL connection');
const pgCheck = exec('pg_isready 2>/dev/null');
if (pgCheck && pgCheck.includes('accepting connections')) {
  pass('PostgreSQL is running');
} else {
  fail('PostgreSQL not running or not installed');
  console.log('   → Install: sudo apt-get install postgresql');
  console.log('   → Start: sudo systemctl start postgresql');
}

// Check 5: Redis
check('Checking Redis connection');
const redisCheck = exec('redis-cli ping 2>/dev/null');
if (redisCheck === 'PONG') {
  pass('Redis is running');
} else {
  fail('Redis not running or not installed');
  console.log('   → Install: sudo apt-get install redis-server');
  console.log('   → Start: sudo systemctl start redis');
}

// Check 6: Node version
check('Checking Node.js version');
const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split('.')[0]);
if (major >= 16) {
  pass(`Node ${nodeVersion} (>= 16 required)`);
} else {
  fail(`Node ${nodeVersion} is too old (need >= 16)`);
  console.log('   → Upgrade Node.js to version 16 or higher');
}

// Check 7: npm configuration
check('Checking npm configuration');
const npmPrefix = exec('npm config get prefix');
const npmRoot = exec('npm root');
if (npmRoot && npmRoot.includes(process.cwd())) {
  pass('npm is configured correctly');
} else {
  fail('npm might be installing to wrong location');
  console.log(`   → npm prefix: ${npmPrefix}`);
  console.log(`   → npm root: ${npmRoot}`);
  console.log('   → Expected: node_modules in current directory');
  console.log('   → Fix: npm config delete prefix && npm install');
}

// Check 8: Disk space
check('Checking disk space');
const diskCheck = exec('df -h . | tail -1');
if (diskCheck) {
  const usage = diskCheck.match(/(\d+)%/);
  if (usage && parseInt(usage[1]) < 90) {
    pass('Sufficient disk space');
  } else {
    fail('Disk usage is high (>90%)');
    console.log('   → Free up disk space');
  }
}

// Check 9: File permissions
check('Checking file permissions');
const stats = fs.statSync('.');
const uid = process.getuid();
if (stats.uid === uid) {
  pass('You own this directory');
} else {
  fail('Permission issues detected');
  console.log('   → Run: sudo chown -R $USER:$USER ~/rindell');
}

// Check 10: Can require modules
if (fs.existsSync('./node_modules')) {
  check('Testing module loading');
  try {
    require('express');
    require('dotenv');
    pass('Modules load successfully');
  } catch (error) {
    critical('Modules exist but cannot be loaded!');
    console.log(`   → Error: ${error.message}`);
    console.log('   → This is unusual - see NODE-MODULES-MISSING.txt');
  }
}

// Summary
console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║                    SUMMARY                             ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

if (criticalIssues > 0) {
  console.log(`🚨 CRITICAL ISSUES FOUND: ${criticalIssues}`);
  console.log('\nYou MUST fix these before the app will start!');
  console.log('\nMost common fix:');
  console.log('  cd ~/rindell/Rindell-Ai');
  console.log('  rm -rf node_modules package-lock.json');
  console.log('  npm cache clean --force');
  console.log('  npm install');
  console.log('  pm2 restart rindell-mvp');
  console.log('\nIf that doesn\'t work, read: NODE-MODULES-MISSING.txt\n');
} else if (issuesFound > 0) {
  console.log(`⚠️  ISSUES FOUND: ${issuesFound}`);
  console.log('\nApp might work but could have problems.');
  console.log('Fix the issues above for best results.\n');
} else {
  console.log('✅ NO ISSUES FOUND!');
  console.log('\nAll checks passed. Your environment looks good.');
  console.log('If app still won\'t start, check PM2 logs:');
  console.log('  pm2 logs rindell-mvp --lines 50\n');
}

process.exit(issuesFound > 0 ? 1 : 0);
