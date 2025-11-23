/**
 * Database module - Re-exports for backwards compatibility
 *
 * This module consolidates all database operations from domain-specific modules.
 * Import from '@/lib/db' to access all database functions.
 */

// Connection
export {
  getDatabase,
  createDatabase,
  createTestDatabase,
  resetDatabase,
  type DatabaseOptions
} from './connection';

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
