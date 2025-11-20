import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { calculateEloOrNull, calculateProgressiveElo, type AnswerRecord } from './scoring/EloCalculator';

// Database path
const DB_PATH = path.join(process.cwd(), 'data', 'game.db');

// Initialize database connection
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
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

  // Check if we need to migrate old questions format
  migrateQuestionsIfNeeded(database);

  // Check if we need to add XP column to existing users table
  migrateUserXpIfNeeded(database);

  // Check if we need to seed the database
  const count = database.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };

  if (count.count === 0) {
    seedQuestions(database);
  }
}

function migrateUserXpIfNeeded(database: Database.Database) {
  // Check if users table has xp column
  const tableInfo = database.pragma('table_info(users)') as Array<{ name: string }>;
  const hasXpColumn = tableInfo.some((col) => col.name === 'xp');

  if (!hasXpColumn) {
    console.log('Adding XP column to users table...');
    database.exec('ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0');
  }
}

function migrateQuestionsIfNeeded(database: Database.Database) {
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

// Query functions
export interface QuestionRow {
  id: number;
  subject_key: string;
  subject_name: string;
  question: string;
  answers: string; // JSON string
  correct_index: number;
  difficulty: number;
  created_at: string;
}

export interface QuestionDTO {
  id: number;
  question: string;
  answers: string[];
  correct: number;
}

export interface SubjectDTO {
  subject: string;
  questions: QuestionDTO[];
}

export interface QuestionDatabaseDTO {
  [key: string]: SubjectDTO;
}

export interface User {
  id: number;
  username: string;
  xp: number;
  created_at: string;
  last_login: string;
}

export interface AnswerLogEntry {
  user_id: number;
  question_id: number;
  selected_answer_index: number;
  is_correct: boolean;
  answer_time_ms?: number;
  timeout_occurred?: boolean;
}

export interface XpLogEntry {
  user_id: number;
  xp_amount: number;
  reason: string;
  enemy_level?: number;
}

// User functions
export function loginUser(username: string): User {
  const db = getDatabase();

  // Try to find existing user (case-insensitive)
  let user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username) as User | undefined;

  if (!user) {
    // Create new user
    const result = db.prepare('INSERT INTO users (username) VALUES (?)').run(username);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
  } else {
    // Update last_login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  }

  return user;
}

export function getUserById(id: number): User | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

// XP functions
export function addXp(entry: XpLogEntry): void {
  const db = getDatabase();

  // Log the XP gain
  db.prepare(`
    INSERT INTO xp_log (user_id, xp_amount, reason, enemy_level)
    VALUES (?, ?, ?, ?)
  `).run(
    entry.user_id,
    entry.xp_amount,
    entry.reason,
    entry.enemy_level || null
  );

  // Update user's total XP
  db.prepare(`
    UPDATE users SET xp = xp + ? WHERE id = ?
  `).run(entry.xp_amount, entry.user_id);
}

// Answer tracking functions
export function logAnswer(entry: AnswerLogEntry): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO answer_log (user_id, question_id, selected_answer_index, is_correct, answer_time_ms, timeout_occurred)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    entry.user_id,
    entry.question_id,
    entry.selected_answer_index,
    entry.is_correct ? 1 : 0,
    entry.answer_time_ms || null,
    entry.timeout_occurred ? 1 : 0
  );
}

// Question functions
export function getAllQuestions(): QuestionDatabaseDTO {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM questions ORDER BY id').all() as QuestionRow[];

  // Transform to the expected format
  const result: QuestionDatabaseDTO = {};

  for (const row of rows) {
    if (!result[row.subject_key]) {
      result[row.subject_key] = {
        subject: row.subject_name,
        questions: []
      };
    }

    result[row.subject_key].questions.push({
      id: row.id,
      question: row.question,
      answers: JSON.parse(row.answers),
      correct: row.correct_index
    });
  }

  return result;
}

export function getQuestionById(id: number): QuestionRow | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as QuestionRow | undefined;
}

// Get all distinct subjects
export function getAllSubjects(): string[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT DISTINCT subject_key FROM questions').all() as { subject_key: string }[];
  return rows.map(row => row.subject_key);
}

// Get questions with ELO scores for a specific subject and user
export interface QuestionWithElo {
  id: number;
  question: string;
  answers: string[];
  correct: number;
  elo: number | null;
  correctCount: number;
  wrongCount: number;
  timeoutCount: number;
}

// NOTE: This function is deprecated and kept for backwards compatibility only
// Use lib/scoring/EloCalculator.ts for new code
// ELO = 10 * (correct_answers / total_answers), rounded, capped 0-10
// If never answered: null
export function calculateElo(correctCount: number, totalCount: number): number | null {
  if (totalCount === 0) {
    return null;
  }
  return Math.round(10.0 * correctCount / totalCount);
}

export function getQuestionsWithEloBySubject(subjectKey: string, userId: number): QuestionWithElo[] {
  const db = getDatabase();

  // Get all questions for this subject
  const questionsQuery = `
    SELECT
      q.id,
      q.question,
      q.answers,
      q.correct_index
    FROM questions q
    WHERE q.subject_key = ?
    ORDER BY q.id
  `;

  const questions = db.prepare(questionsQuery).all(subjectKey) as any[];

  // Get answer history for each question
  const answersQuery = `
    SELECT
      is_correct,
      timeout_occurred
    FROM answer_log
    WHERE question_id = ? AND user_id = ?
    ORDER BY answered_at
  `;

  const answersStmt = db.prepare(answersQuery);

  return questions.map(q => {
    const answerRecords = answersStmt.all(q.id, userId) as Array<{
      is_correct: number;
      timeout_occurred: number;
    }>;

    // Convert to AnswerRecord format
    const answers: AnswerRecord[] = answerRecords.map(record => ({
      is_correct: record.is_correct === 1,
      timeout_occurred: record.timeout_occurred === 1
    }));

    // Calculate progressive ELO
    const elo = calculateEloOrNull(answers);

    // Calculate counts for display
    const correctCount = answers.filter(a => a.is_correct).length;
    const wrongCount = answers.filter(a => !a.is_correct && !a.timeout_occurred).length;
    const timeoutCount = answers.filter(a => a.timeout_occurred).length;

    return {
      id: q.id,
      question: q.question,
      answers: JSON.parse(q.answers),
      correct: q.correct_index,
      elo,
      correctCount,
      wrongCount,
      timeoutCount
    };
  });
}

// Get average ELO per subject for session tracking
export interface SubjectEloScore {
  subjectKey: string;
  subjectName: string;
  averageElo: number;
}

export function getSessionEloScores(userId: number): SubjectEloScore[] {
  const db = getDatabase();

  // Get all questions grouped by subject
  const questionsQuery = `
    SELECT
      q.subject_key,
      q.subject_name,
      q.id
    FROM questions q
    ORDER BY q.subject_key, q.id
  `;

  const questions = db.prepare(questionsQuery).all() as Array<{
    subject_key: string;
    subject_name: string;
    id: number;
  }>;

  // Get answer history for user
  const answersQuery = `
    SELECT
      question_id,
      is_correct,
      timeout_occurred
    FROM answer_log
    WHERE user_id = ?
    ORDER BY question_id, answered_at
  `;

  const allAnswers = db.prepare(answersQuery).all(userId) as Array<{
    question_id: number;
    is_correct: number;
    timeout_occurred: number;
  }>;

  // Group answers by question
  const answersByQuestion = new Map<number, AnswerRecord[]>();
  for (const answer of allAnswers) {
    if (!answersByQuestion.has(answer.question_id)) {
      answersByQuestion.set(answer.question_id, []);
    }
    answersByQuestion.get(answer.question_id)!.push({
      is_correct: answer.is_correct === 1,
      timeout_occurred: answer.timeout_occurred === 1
    });
  }

  // Calculate ELO per question, then average per subject
  const subjectElos: { [key: string]: { name: string; elos: number[] } } = {};

  for (const q of questions) {
    if (!subjectElos[q.subject_key]) {
      subjectElos[q.subject_key] = {
        name: q.subject_name,
        elos: []
      };
    }

    const answers = answersByQuestion.get(q.id) || [];
    // Use unrounded progressive ELO for accurate averaging
    const elo = answers.length > 0 ? calculateProgressiveElo(answers) : 5;
    subjectElos[q.subject_key].elos.push(elo);
  }

  // Calculate average ELO per subject (average first, then round)
  return Object.entries(subjectElos).map(([key, data]) => {
    const avg = data.elos.reduce((sum, elo) => sum + elo, 0) / data.elos.length;
    return {
      subjectKey: key,
      subjectName: data.name,
      averageElo: Math.round(avg)
    };
  });
}
