const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'game.db');
console.log('Checking database at:', dbPath);

try {
  const db = new Database(dbPath);

  // Check users table structure
  console.log('\n=== Users Table Schema ===');
  const tableInfo = db.pragma('table_info(users)');
  console.log(tableInfo);

  // Try to select a user
  console.log('\n=== Sample Users ===');
  const users = db.prepare('SELECT * FROM users LIMIT 3').all();
  console.log(users);

  db.close();
  console.log('\n✓ Database check complete');
} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}
