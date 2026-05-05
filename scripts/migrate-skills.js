#!/usr/bin/env node
/**
 * Migration script to add skill system tables to existing database
 * Run with: node scripts/migrate-skills.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'data', 'game.db');
const sqlPath = path.join(process.cwd(), 'scripts', 'migrate-skills.sql');

console.log('🔧 Starting skill system migration...');
console.log('Database:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database not found at:', dbPath);
  process.exit(1);
}

try {
  const db = new Database(dbPath);
  const migration = fs.readFileSync(sqlPath, 'utf-8');

  console.log('📖 Executing migration...');
  db.exec(migration);

  console.log('✅ Migration completed successfully!');
  console.log('');
  console.log('Skill tables created:');
  console.log('  - skill_points');
  console.log('  - user_skills');
  console.log('');
  console.log('You can now restart your dev server.');

  db.close();
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
