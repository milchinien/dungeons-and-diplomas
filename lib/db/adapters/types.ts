/**
 * Database Adapter Interface
 *
 * Defines the contract for all database operations.
 * Both SQLite and Supabase adapters must implement this interface.
 *
 * All methods are async to support both sync (SQLite) and async (Supabase) backends.
 */

import type { User } from '../users';
import type {
  QuestionRow,
  QuestionDatabaseDTO,
  QuestionWithElo,
} from '../questions';
import type { UserStats } from '../stats';
import type { Highscore, HighscoreEntry } from '../highscores';
import type { EditorLevel } from '../editorLevels';
import type { AnswerLogEntry, XpLogEntry, SubjectEloScore } from '../../types/api';
import type { ImportedTileset, TileTheme, DungeonTheme } from '../../tiletheme/types';

/**
 * Database adapter type
 */
export type AdapterType = 'sqlite' | 'supabase';

/**
 * Main database adapter interface
 *
 * All database operations go through this interface.
 * Implementations must handle their own connection management.
 */
export interface DatabaseAdapter {
  // ============================================================================
  // Users
  // ============================================================================

  /**
   * Login or create a user (case-insensitive username lookup)
   */
  loginUser(username: string): Promise<User>;

  /**
   * Get user by ID
   */
  getUserById(id: number): Promise<User | undefined>;

  // ============================================================================
  // Questions
  // ============================================================================

  /**
   * Get all questions grouped by subject
   */
  getAllQuestions(): Promise<QuestionDatabaseDTO>;

  /**
   * Get a single question by ID
   */
  getQuestionById(id: number): Promise<QuestionRow | undefined>;

  /**
   * Get all distinct subject keys
   */
  getAllSubjects(): Promise<string[]>;

  /**
   * Get questions with ELO scores for a specific subject and user
   */
  getQuestionsWithEloBySubject(subjectKey: string, userId: number): Promise<QuestionWithElo[]>;

  /**
   * Get average ELO per subject for session tracking
   */
  getSessionEloScores(userId: number): Promise<SubjectEloScore[]>;

  // ============================================================================
  // Answers
  // ============================================================================

  /**
   * Log an answer to the database
   */
  logAnswer(entry: AnswerLogEntry): Promise<void>;

  // ============================================================================
  // XP
  // ============================================================================

  /**
   * Add XP to a user and log the gain
   */
  addXp(entry: XpLogEntry): Promise<void>;

  // ============================================================================
  // Stats
  // ============================================================================

  /**
   * Get comprehensive user statistics grouped by subject
   */
  getUserStats(userId: number): Promise<UserStats>;

  // ============================================================================
  // Highscores
  // ============================================================================

  /**
   * Save a new highscore entry
   */
  saveHighscore(entry: HighscoreEntry): Promise<Highscore>;

  /**
   * Get top highscores (default: top 10)
   */
  getTopHighscores(limit?: number): Promise<Highscore[]>;

  /**
   * Get highscores for a specific user
   */
  getUserHighscores(userId: number, limit?: number): Promise<Highscore[]>;

  /**
   * Get the rank of a specific score
   */
  getScoreRank(score: number): Promise<number>;

  /**
   * Check if a score is a new personal best for a user
   */
  isPersonalBest(userId: number, score: number): Promise<boolean>;

  // ============================================================================
  // Editor Levels
  // ============================================================================

  /**
   * Save a new editor level
   */
  saveEditorLevel(level: EditorLevel): Promise<number>;

  /**
   * Get all editor levels (optionally filtered by user)
   */
  getEditorLevels(userId?: number): Promise<EditorLevel[]>;

  /**
   * Get a single editor level by ID
   */
  getEditorLevel(id: number): Promise<EditorLevel | null>;

  /**
   * Update an existing editor level
   */
  updateEditorLevel(id: number, updates: Partial<EditorLevel>): Promise<void>;

  /**
   * Delete an editor level
   */
  deleteEditorLevel(id: number): Promise<void>;

  // ============================================================================
  // Tilesets
  // ============================================================================

  /**
   * Save a new tileset
   */
  saveTileset(tileset: Omit<ImportedTileset, 'id' | 'created_at'>): Promise<number>;

  /**
   * Get all tilesets
   */
  getTilesets(): Promise<ImportedTileset[]>;

  /**
   * Get a single tileset by ID
   */
  getTileset(id: number): Promise<ImportedTileset | null>;

  /**
   * Delete a tileset by ID
   */
  deleteTileset(id: number): Promise<void>;

  // ============================================================================
  // Tile Themes
  // ============================================================================

  /**
   * Save a new tile theme
   */
  saveTileTheme(theme: Omit<TileTheme, 'id' | 'created_at' | 'updated_at'>): Promise<number>;

  /**
   * Get all tile themes
   */
  getTileThemes(): Promise<TileTheme[]>;

  /**
   * Get a single tile theme by ID
   */
  getTileTheme(id: number): Promise<TileTheme | null>;

  /**
   * Update a tile theme
   */
  updateTileTheme(id: number, updates: Partial<TileTheme>): Promise<void>;

  /**
   * Delete a tile theme by ID
   */
  deleteTileTheme(id: number): Promise<void>;

  // ============================================================================
  // Dungeon Themes
  // ============================================================================

  /**
   * Save a new dungeon theme
   */
  saveDungeonTheme(theme: Omit<DungeonTheme, 'id' | 'created_at' | 'updated_at'>): Promise<number>;

  /**
   * Get all dungeon themes
   */
  getDungeonThemes(): Promise<DungeonTheme[]>;

  /**
   * Get a single dungeon theme by ID
   */
  getDungeonTheme(id: number): Promise<DungeonTheme | null>;

  /**
   * Update a dungeon theme
   */
  updateDungeonTheme(id: number, updates: Partial<DungeonTheme>): Promise<void>;

  /**
   * Delete a dungeon theme by ID
   */
  deleteDungeonTheme(id: number): Promise<void>;
}
