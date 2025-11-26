/**
 * Database initialization and seeding
 */
import type Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { migrateEditorLevelsIfNeeded, migrateQuestionsIfNeeded, migrateUserXpIfNeeded } from './migrations';

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

  // Migration: Add new columns to existing editor_levels table if needed
  migrateEditorLevelsIfNeeded(database);

  // Create indices for editor_levels
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_editor_levels_created_by ON editor_levels(created_by)
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_editor_levels_name ON editor_levels(name)
  `);

  // Check if we need to migrate old questions format
  migrateQuestionsIfNeeded(database);

  // Check if we need to add XP column to existing users table
  migrateUserXpIfNeeded(database);

  // Check if we need to seed the database
  if (shouldSeed) {
    const count = database.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };

    if (count.count === 0) {
      seedQuestions(database);
    }
  }
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
