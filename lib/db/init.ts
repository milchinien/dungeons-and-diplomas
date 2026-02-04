/**
 * Database initialization and seeding
 */
import type Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { migrateEditorLevelsIfNeeded, migrateQuestionsIfNeeded, migrateUserXpIfNeeded, migrateUserGoldIfNeeded, migrateRoomLayoutDoorPositionsIfNeeded } from './migrations';

export interface InitOptions {
  /** Whether to seed with initial question data (default: true) */
  seed?: boolean;
}

export function initializeDatabase(database: Database.Database, options: InitOptions = {}) {
  const shouldSeed = options.seed ?? true;
  // Create users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      xp INTEGER DEFAULT 0,
      gold INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create questions table (migrate old schema to new)
  database.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_key TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      question TEXT NOT NULL,
      answers TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      difficulty INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create answer_log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS answer_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      question_id INTEGER NOT NULL,
      selected_answer_index INTEGER NOT NULL,
      is_correct BOOLEAN NOT NULL,
      answer_time_ms INTEGER,
      timeout_occurred BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);

  // Create xp_log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS xp_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      gained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      xp_amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      enemy_level INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create gold_log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS gold_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      gold_amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      enemy_level INTEGER,
      item_sold TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create highscores table
  database.exec(`
    CREATE TABLE IF NOT EXISTS highscores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      enemies_defeated INTEGER DEFAULT 0,
      rooms_explored INTEGER DEFAULT 0,
      xp_gained INTEGER DEFAULT 0,
      max_combo INTEGER DEFAULT 0,
      play_time_seconds INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create index for highscores
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_highscores_score ON highscores(score DESC)
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_highscores_user ON highscores(user_id)
  `);

  // Create editor_levels table
  database.exec(`
    CREATE TABLE IF NOT EXISTS editor_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      structure_seed INTEGER NOT NULL,
      decoration_seed INTEGER NOT NULL,
      spawn_seed INTEGER NOT NULL,
      width INTEGER NOT NULL DEFAULT 100,
      height INTEGER NOT NULL DEFAULT 100,
      algorithm INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Create room_layouts table
  database.exec(`
    CREATE TABLE IF NOT EXISTS room_layouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      width INTEGER NOT NULL CHECK (width >= 5 AND width <= 15),
      height INTEGER NOT NULL CHECK (height >= 5 AND height <= 15),
      tile_grid TEXT NOT NULL,
      door_positions TEXT NOT NULL,
      room_type TEXT DEFAULT 'any' CHECK (room_type IN ('empty', 'treasure', 'combat', 'shop', 'any')),
      difficulty INTEGER DEFAULT 5 CHECK (difficulty >= 1 AND difficulty <= 10),
      tags TEXT DEFAULT '[]',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Migration: Add new columns to existing editor_levels table if needed
  migrateEditorLevelsIfNeeded(database);

  // Create indices for editor_levels
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_editor_levels_created_by ON editor_levels(created_by)
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_editor_levels_name ON editor_levels(name)
  `);

  // Create indices for room_layouts
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_room_layouts_type ON room_layouts(room_type)
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_room_layouts_size ON room_layouts(width, height)
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_room_layouts_difficulty ON room_layouts(difficulty)
  `);

  // Check if we need to migrate old questions format
  migrateQuestionsIfNeeded(database);

  // Check if we need to add XP column to existing users table
  migrateUserXpIfNeeded(database);

  // Check if we need to add gold column to existing users table
  migrateUserGoldIfNeeded(database);

  // Check if we need to migrate room layout door positions
  migrateRoomLayoutDoorPositionsIfNeeded(database);

  // Check if we need to seed the database
  if (shouldSeed) {
    const count = database.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };

    if (count.count === 0) {
      seedQuestions(database);
    }

    // Seed room layouts
    seedRoomLayouts(database);
  }
}

/**
 * Seeds starter room layouts
 */
function seedRoomLayouts(database: Database.Database) {
  // Check if already seeded
  const count = database.prepare('SELECT COUNT(*) as count FROM room_layouts').get() as { count: number };
  if (count.count > 0) {
    console.log('Room layouts already seeded, skipping...');
    return;
  }

  console.log('Seeding room layouts...');

  // Load layouts from JSON file
  const layoutsPath = path.join(process.cwd(), 'lib', 'data', 'seed-room-layouts.json');
  const layoutsJson = fs.readFileSync(layoutsPath, 'utf-8');
  const layouts = JSON.parse(layoutsJson);

  // Prepare insert statement
  const insert = database.prepare(`
    INSERT INTO room_layouts (
      name, width, height, tile_grid, door_positions,
      room_type, difficulty, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Insert all layouts in a transaction
  const insertMany = database.transaction((layouts: any[]) => {
    for (const layout of layouts) {
      insert.run(
        layout.name,
        layout.width,
        layout.height,
        JSON.stringify(layout.tileGrid),
        JSON.stringify(layout.doorPositions),
        layout.roomType || 'any',
        layout.difficulty || 5,
        JSON.stringify(layout.tags || [])
      );
    }
  });

  insertMany(layouts);
  console.log(`✓ Seeded ${layouts.length} room layouts`);
}

function seedQuestions(database: Database.Database) {
  // Load questions from JSON file
  const questionsPath = path.join(process.cwd(), 'lib', 'data', 'seed-questions.json');
  const questionsJson = fs.readFileSync(questionsPath, 'utf-8');
  const questions = JSON.parse(questionsJson);

  // Prepare insert statement
  const insert = database.prepare(`
    INSERT INTO questions (subject_key, subject_name, question, answers, correct_index, difficulty)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Insert all questions in a transaction
  const insertMany = database.transaction((questions: any[]) => {
    for (const q of questions) {
      const answersJson = JSON.stringify(q.answers);
      insert.run(
        q.subjectKey,
        q.subjectName,
        q.question,
        answersJson,
        q.correct,
        5 // default difficulty
      );
    }
  });

  insertMany(questions);
}
