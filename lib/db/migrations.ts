/**
 * Database migrations
 */
import type Database from 'better-sqlite3';

export function migrateUserXpIfNeeded(database: Database.Database) {
  // Check if users table has xp column
  const tableInfo = database.pragma('table_info(users)') as Array<{ name: string }>;
  const hasXpColumn = tableInfo.some((col) => col.name === 'xp');

  if (!hasXpColumn) {
    console.log('Adding XP column to users table...');
    database.exec('ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0');
  }
}

export function migrateEditorLevelsIfNeeded(database: Database.Database) {
  // Check if editor_levels table has the new columns
  const tableInfo = database.pragma('table_info(editor_levels)') as Array<{ name: string }>;
  const hasWidthColumn = tableInfo.some((col) => col.name === 'width');
  const hasHeightColumn = tableInfo.some((col) => col.name === 'height');
  const hasAlgorithmColumn = tableInfo.some((col) => col.name === 'algorithm');

  if (tableInfo.length > 0 && !hasWidthColumn) {
    console.log('Adding width column to editor_levels table...');
    database.exec('ALTER TABLE editor_levels ADD COLUMN width INTEGER NOT NULL DEFAULT 100');
  }

  if (tableInfo.length > 0 && !hasHeightColumn) {
    console.log('Adding height column to editor_levels table...');
    database.exec('ALTER TABLE editor_levels ADD COLUMN height INTEGER NOT NULL DEFAULT 100');
  }

  if (tableInfo.length > 0 && !hasAlgorithmColumn) {
    console.log('Adding algorithm column to editor_levels table...');
    database.exec('ALTER TABLE editor_levels ADD COLUMN algorithm INTEGER NOT NULL DEFAULT 1');
  }
}

export function migrateQuestionsIfNeeded(database: Database.Database) {
  // Check if old schema exists (has answer_0 column)
  const tableInfo = database.pragma('table_info(questions)') as Array<{ name: string }>;
  const hasOldSchema = tableInfo.some((col) => col.name === 'answer_0');

  if (hasOldSchema) {
    console.log('Migrating questions table to new schema...');

    // Get all old questions
    const oldQuestions = database.prepare('SELECT * FROM questions').all() as any[];

    // Drop old table
    database.exec('DROP TABLE questions');

    // Create new table
    database.exec(`
      CREATE TABLE questions (
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

    // Migrate data
    const insert = database.prepare(`
      INSERT INTO questions (id, subject_key, subject_name, question, answers, correct_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const migrate = database.transaction((questions: any[]) => {
      for (const q of questions) {
        const answers = JSON.stringify([q.answer_0, q.answer_1, q.answer_2, q.answer_3]);
        insert.run(q.id, q.subject_key, q.subject_name, q.question, answers, q.correct_index, q.created_at);
      }
    });

    migrate(oldQuestions);
    console.log(`Migrated ${oldQuestions.length} questions to new schema`);
  }
}
