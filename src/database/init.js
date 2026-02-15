/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║          RINDELL MVP - DATABASE INITIALIZATION            ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const db = require('./index');

async function initializeDatabase() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║         Initializing Rindell Database...              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Connect to database
    await db.connect();

    // Initialize schema
    await db.initializeSchema();

    console.log('\n✅ Database initialization complete!\n');
    
    // Test queries
    console.log('Running test queries...');
    
    const testResults = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM documents'),
      db.query('SELECT COUNT(*) FROM summaries'),
    ]);

    console.log(`  Users: ${testResults[0].rows[0].count}`);
    console.log(`  Documents: ${testResults[1].rows[0].count}`);
    console.log(`  Summaries: ${testResults[2].rows[0].count}`);

    console.log('\n✅ All tables accessible\n');

    await db.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
