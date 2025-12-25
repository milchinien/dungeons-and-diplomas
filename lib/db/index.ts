/**
 * Database module - Re-exports for backwards compatibility
 *
 * This module consolidates all database operations from domain-specific modules.
 * Import from '@/lib/db' to access all database functions.
 *
 * Note: All database functions are now async and return Promises.
 */

// Connection (for SQLite-only usage, testing, etc.)
export {
  getDatabase,
  createDatabase,
  createTestDatabase,
  resetDatabase,
  type DatabaseOptions
} from './connection';

// Adapters
export {
  getAdapter,
  getAdapterType,
  isSupabaseMode,
  resetAdapter,
  type DatabaseAdapter,
  type AdapterType
} from './adapters';

// Users
export { loginUser, getUserById, type User } from './users';

// XP
export { addXp, type XpLogEntry } from './xp';

// Answers
export { logAnswer, type AnswerLogEntry } from './answers';

// Questions
export {
  getAllQuestions,
  getQuestionById,
  getAllSubjects,
  getQuestionsWithEloBySubject,
  getSessionEloScores,
  type QuestionRow,
  type QuestionDTO,
  type SubjectDTO,
  type QuestionDatabaseDTO,
  type QuestionWithElo,
  type SubjectEloScore
} from './questions';

// Editor Levels
export {
  saveEditorLevel,
  getEditorLevels,
  getEditorLevel,
  updateEditorLevel,
  deleteEditorLevel,
  type EditorLevel
} from './editorLevels';

// Stats
export {
  getUserStats,
  type QuestionStats,
  type SubjectStats,
  type UserStats
} from './stats';

// Highscores
export {
  saveHighscore,
  getTopHighscores,
  getUserHighscores,
  getScoreRank,
  isPersonalBest,
  calculateScore,
  type Highscore,
  type HighscoreEntry
} from './highscores';
