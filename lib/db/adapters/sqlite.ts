/**
 * SQLite Database Adapter
 *
 * Wraps the existing better-sqlite3 implementation with async interface.
 * All methods are synchronous internally but wrapped in Promises for
 * compatibility with the DatabaseAdapter interface.
 */

import type Database from 'better-sqlite3';
import type { DatabaseAdapter } from './types';
import type { User } from '../users';
import type {
  QuestionRow,
  QuestionDatabaseDTO,
  QuestionWithElo,
} from '../questions';
import type { UserStats, QuestionStats } from '../stats';
import type { Highscore, HighscoreEntry } from '../highscores';
import type { EditorLevel } from '../editorLevels';
import type { AnswerLogEntry, XpLogEntry, SubjectEloScore } from '../../types/api';
import type { ImportedTileset, TileTheme, DungeonTheme } from '../../tiletheme/types';
import {
  calculateEloOrNull,
  calculateProgressiveElo,
  calculateRoundedElo,
  type AnswerRecord,
} from '../../scoring/EloCalculator';

/**
 * SQLite adapter implementation
 */
export class SQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database;
  private tilethemeTablesInitialized = false;

  constructor(database: Database.Database) {
    this.db = database;
  }

  // ============================================================================
  // Users
  // ============================================================================

  async loginUser(username: string): Promise<User> {
    let user = this.db
      .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
      .get(username) as User | undefined;

    if (!user) {
      const result = this.db
        .prepare('INSERT INTO users (username) VALUES (?)')
        .run(username);
      user = this.db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(result.lastInsertRowid) as User;
    } else {
      this.db
        .prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
        .run(user.id);
    }

    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as User | undefined;
  }

  // ============================================================================
  // Questions
  // ============================================================================

  async getAllQuestions(): Promise<QuestionDatabaseDTO> {
    const rows = this.db
      .prepare('SELECT * FROM questions ORDER BY id')
      .all() as QuestionRow[];

    const result: QuestionDatabaseDTO = {};

    for (const row of rows) {
      if (!result[row.subject_key]) {
        result[row.subject_key] = {
          subject: row.subject_name,
          questions: [],
        };
      }

      result[row.subject_key].questions.push({
        id: row.id,
        question: row.question,
        answers: JSON.parse(row.answers),
        correct: row.correct_index,
      });
    }

    return result;
  }

  async getQuestionById(id: number): Promise<QuestionRow | undefined> {
    return this.db
      .prepare('SELECT * FROM questions WHERE id = ?')
      .get(id) as QuestionRow | undefined;
  }

  async getAllSubjects(): Promise<string[]> {
    const rows = this.db
      .prepare('SELECT DISTINCT subject_key FROM questions')
      .all() as { subject_key: string }[];
    return rows.map((row) => row.subject_key);
  }

  async getQuestionsWithEloBySubject(
    subjectKey: string,
    userId: number
  ): Promise<QuestionWithElo[]> {
    const questionsQuery = `
      SELECT q.id, q.question, q.answers, q.correct_index
      FROM questions q
      WHERE q.subject_key = ?
      ORDER BY q.id
    `;

    const questions = this.db.prepare(questionsQuery).all(subjectKey) as Array<{
      id: number;
      question: string;
      answers: string;
      correct_index: number;
    }>;

    const answersQuery = `
      SELECT is_correct, timeout_occurred
      FROM answer_log
      WHERE question_id = ? AND user_id = ?
      ORDER BY answered_at
    `;

    const answersStmt = this.db.prepare(answersQuery);

    return questions.map((q) => {
      const answerRecords = answersStmt.all(q.id, userId) as Array<{
        is_correct: number;
        timeout_occurred: number;
      }>;

      const answers: AnswerRecord[] = answerRecords.map((record) => ({
        is_correct: record.is_correct === 1,
        timeout_occurred: record.timeout_occurred === 1,
      }));

      const elo = calculateEloOrNull(answers);
      const correctCount = answers.filter((a) => a.is_correct).length;
      const wrongCount = answers.filter((a) => !a.is_correct && !a.timeout_occurred).length;
      const timeoutCount = answers.filter((a) => a.timeout_occurred).length;

      return {
        id: q.id,
        question: q.question,
        answers: JSON.parse(q.answers),
        correct: q.correct_index,
        elo,
        correctCount,
        wrongCount,
        timeoutCount,
      };
    });
  }

  async getSessionEloScores(userId: number): Promise<SubjectEloScore[]> {
    const questionsQuery = `
      SELECT q.subject_key, q.subject_name, q.id
      FROM questions q
      ORDER BY q.subject_key, q.id
    `;

    const questions = this.db.prepare(questionsQuery).all() as Array<{
      subject_key: string;
      subject_name: string;
      id: number;
    }>;

    const answersQuery = `
      SELECT question_id, is_correct, timeout_occurred
      FROM answer_log
      WHERE user_id = ?
      ORDER BY question_id, answered_at
    `;

    const allAnswers = this.db.prepare(answersQuery).all(userId) as Array<{
      question_id: number;
      is_correct: number;
      timeout_occurred: number;
    }>;

    const answersByQuestion = new Map<number, AnswerRecord[]>();
    for (const answer of allAnswers) {
      if (!answersByQuestion.has(answer.question_id)) {
        answersByQuestion.set(answer.question_id, []);
      }
      answersByQuestion.get(answer.question_id)!.push({
        is_correct: answer.is_correct === 1,
        timeout_occurred: answer.timeout_occurred === 1,
      });
    }

    const subjectElos: { [key: string]: { name: string; elos: number[] } } = {};

    for (const q of questions) {
      if (!subjectElos[q.subject_key]) {
        subjectElos[q.subject_key] = { name: q.subject_name, elos: [] };
      }

      const answers = answersByQuestion.get(q.id) || [];
      const elo = answers.length > 0 ? calculateProgressiveElo(answers) : 5;
      subjectElos[q.subject_key].elos.push(elo);
    }

    return Object.entries(subjectElos).map(([key, data]) => {
      const avg = data.elos.reduce((sum, elo) => sum + elo, 0) / data.elos.length;
      return {
        subjectKey: key,
        subjectName: data.name,
        averageElo: Math.round(avg),
      };
    });
  }

  // ============================================================================
  // Answers
  // ============================================================================

  async logAnswer(entry: AnswerLogEntry): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO answer_log (user_id, question_id, selected_answer_index, is_correct, answer_time_ms, timeout_occurred)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        entry.user_id,
        entry.question_id,
        entry.selected_answer_index,
        entry.is_correct ? 1 : 0,
        entry.answer_time_ms || null,
        entry.timeout_occurred ? 1 : 0
      );
  }

  // ============================================================================
  // XP
  // ============================================================================

  async addXp(entry: XpLogEntry): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO xp_log (user_id, xp_amount, reason, enemy_level)
         VALUES (?, ?, ?, ?)`
      )
      .run(entry.user_id, entry.xp_amount, entry.reason, entry.enemy_level || null);

    this.db
      .prepare('UPDATE users SET xp = xp + ? WHERE id = ?')
      .run(entry.xp_amount, entry.user_id);
  }

  // ============================================================================
  // Stats
  // ============================================================================

  async getUserStats(userId: number): Promise<UserStats> {
    const query = `
      SELECT q.id, q.subject_key, q.subject_name, q.question, a.is_correct, a.timeout_occurred
      FROM answer_log a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = ?
      ORDER BY q.subject_key, q.id, a.answered_at
    `;

    const rows = this.db.prepare(query).all(userId) as Array<{
      id: number;
      subject_key: string;
      subject_name: string;
      question: string;
      is_correct: number;
      timeout_occurred: number;
    }>;

    interface QuestionAggregation {
      id: number;
      subject_key: string;
      subject_name: string;
      question: string;
      answers: AnswerRecord[];
      correct: number;
      wrong: number;
      timeout: number;
    }

    const questionStats = new Map<number, QuestionAggregation>();

    for (const row of rows) {
      if (!questionStats.has(row.id)) {
        questionStats.set(row.id, {
          id: row.id,
          subject_key: row.subject_key,
          subject_name: row.subject_name,
          question: row.question,
          answers: [],
          correct: 0,
          wrong: 0,
          timeout: 0,
        });
      }

      const stats = questionStats.get(row.id)!;

      stats.answers.push({
        is_correct: row.is_correct === 1,
        timeout_occurred: row.timeout_occurred === 1,
      });

      if (row.timeout_occurred) {
        stats.timeout++;
      } else if (row.is_correct) {
        stats.correct++;
      } else {
        stats.wrong++;
      }
    }

    const bySubject: {
      [key: string]: {
        subject_name: string;
        questions: QuestionStats[];
        question_elos: number[];
      };
    } = {};

    questionStats.forEach((stats) => {
      if (!bySubject[stats.subject_key]) {
        bySubject[stats.subject_key] = {
          subject_name: stats.subject_name,
          questions: [],
          question_elos: [],
        };
      }

      const roundedElo = calculateRoundedElo(stats.answers);
      const progressiveElo = calculateProgressiveElo(stats.answers);

      bySubject[stats.subject_key].questions.push({
        id: stats.id,
        question: stats.question,
        correct: stats.correct,
        wrong: stats.wrong,
        timeout: stats.timeout,
        elo: roundedElo,
      });

      bySubject[stats.subject_key].question_elos.push(progressiveElo);
    });

    const result: UserStats = {};

    for (const [key, subject] of Object.entries(bySubject)) {
      const average =
        subject.question_elos.reduce((sum, elo) => sum + elo, 0) /
        subject.question_elos.length;

      result[key] = {
        subject_name: subject.subject_name,
        questions: subject.questions,
        average_elo: Math.round(average),
      };
    }

    return result;
  }

  // ============================================================================
  // Highscores
  // ============================================================================

  async saveHighscore(entry: HighscoreEntry): Promise<Highscore> {
    const result = this.db
      .prepare(
        `INSERT INTO highscores (user_id, score, enemies_defeated, rooms_explored, xp_gained, max_combo, play_time_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        entry.user_id,
        entry.score,
        entry.enemies_defeated,
        entry.rooms_explored,
        entry.xp_gained,
        entry.max_combo,
        entry.play_time_seconds
      );

    return this.db
      .prepare(
        `SELECT h.*, u.username
         FROM highscores h
         JOIN users u ON h.user_id = u.id
         WHERE h.id = ?`
      )
      .get(result.lastInsertRowid) as Highscore;
  }

  async getTopHighscores(limit: number = 10): Promise<Highscore[]> {
    return this.db
      .prepare(
        `SELECT h.*, u.username
         FROM highscores h
         JOIN users u ON h.user_id = u.id
         ORDER BY h.score DESC
         LIMIT ?`
      )
      .all(limit) as Highscore[];
  }

  async getUserHighscores(userId: number, limit: number = 10): Promise<Highscore[]> {
    return this.db
      .prepare(
        `SELECT h.*, u.username
         FROM highscores h
         JOIN users u ON h.user_id = u.id
         WHERE h.user_id = ?
         ORDER BY h.score DESC
         LIMIT ?`
      )
      .all(userId, limit) as Highscore[];
  }

  async getScoreRank(score: number): Promise<number> {
    const result = this.db
      .prepare('SELECT COUNT(*) + 1 as rank FROM highscores WHERE score > ?')
      .get(score) as { rank: number };
    return result.rank;
  }

  async isPersonalBest(userId: number, score: number): Promise<boolean> {
    const result = this.db
      .prepare('SELECT MAX(score) as best_score FROM highscores WHERE user_id = ?')
      .get(userId) as { best_score: number | null };
    return result.best_score === null || score > result.best_score;
  }

  // ============================================================================
  // Editor Levels
  // ============================================================================

  async saveEditorLevel(level: EditorLevel): Promise<number> {
    const result = this.db
      .prepare(
        `INSERT INTO editor_levels (name, structure_seed, decoration_seed, spawn_seed, width, height, algorithm, created_by, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        level.name,
        level.structure_seed,
        level.decoration_seed,
        level.spawn_seed,
        level.width,
        level.height,
        level.algorithm,
        level.created_by || null,
        level.notes || null
      );

    return result.lastInsertRowid as number;
  }

  async getEditorLevels(userId?: number): Promise<EditorLevel[]> {
    let query = 'SELECT * FROM editor_levels';
    const params: number[] = [];

    if (userId) {
      query += ' WHERE created_by = ?';
      params.push(userId);
    }

    query += ' ORDER BY updated_at DESC';

    return this.db.prepare(query).all(...params) as EditorLevel[];
  }

  async getEditorLevel(id: number): Promise<EditorLevel | null> {
    const result = this.db
      .prepare('SELECT * FROM editor_levels WHERE id = ?')
      .get(id);
    return result ? (result as EditorLevel) : null;
  }

  async updateEditorLevel(id: number, updates: Partial<EditorLevel>): Promise<void> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.structure_seed !== undefined) {
      fields.push('structure_seed = ?');
      values.push(updates.structure_seed);
    }
    if (updates.decoration_seed !== undefined) {
      fields.push('decoration_seed = ?');
      values.push(updates.decoration_seed);
    }
    if (updates.spawn_seed !== undefined) {
      fields.push('spawn_seed = ?');
      values.push(updates.spawn_seed);
    }
    if (updates.width !== undefined) {
      fields.push('width = ?');
      values.push(updates.width);
    }
    if (updates.height !== undefined) {
      fields.push('height = ?');
      values.push(updates.height);
    }
    if (updates.algorithm !== undefined) {
      fields.push('algorithm = ?');
      values.push(updates.algorithm);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db
      .prepare(`UPDATE editor_levels SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values);
  }

  async deleteEditorLevel(id: number): Promise<void> {
    this.db.prepare('DELETE FROM editor_levels WHERE id = ?').run(id);
  }

  // ============================================================================
  // Tiletheme Tables Initialization
  // ============================================================================

  private initializeTilethemeTables(): void {
    if (this.tilethemeTablesInitialized) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tilesets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        width_tiles INTEGER NOT NULL,
        height_tiles INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tile_themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        floor_config TEXT NOT NULL,
        wall_config TEXT NOT NULL,
        door_config TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dungeon_themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        dark_theme_id INTEGER NOT NULL,
        light_theme_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dark_theme_id) REFERENCES tile_themes(id),
        FOREIGN KEY (light_theme_id) REFERENCES tile_themes(id)
      )
    `);

    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tile_themes_name ON tile_themes(name)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_dungeon_themes_name ON dungeon_themes(name)');

    this.tilethemeTablesInitialized = true;
  }

  // ============================================================================
  // Tilesets
  // ============================================================================

  async saveTileset(tileset: Omit<ImportedTileset, 'id' | 'created_at'>): Promise<number> {
    this.initializeTilethemeTables();

    const result = this.db
      .prepare(
        `INSERT INTO tilesets (name, path, width_tiles, height_tiles)
         VALUES (?, ?, ?, ?)`
      )
      .run(tileset.name, tileset.path, tileset.widthTiles, tileset.heightTiles);

    return result.lastInsertRowid as number;
  }

  async getTilesets(): Promise<ImportedTileset[]> {
    this.initializeTilethemeTables();

    const rows = this.db
      .prepare('SELECT * FROM tilesets ORDER BY created_at DESC')
      .all() as Array<{
      id: number;
      name: string;
      path: string;
      width_tiles: number;
      height_tiles: number;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      path: row.path,
      widthTiles: row.width_tiles,
      heightTiles: row.height_tiles,
      created_at: row.created_at,
    }));
  }

  async getTileset(id: number): Promise<ImportedTileset | null> {
    this.initializeTilethemeTables();

    const row = this.db
      .prepare('SELECT * FROM tilesets WHERE id = ?')
      .get(id) as {
      id: number;
      name: string;
      path: string;
      width_tiles: number;
      height_tiles: number;
      created_at: string;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      path: row.path,
      widthTiles: row.width_tiles,
      heightTiles: row.height_tiles,
      created_at: row.created_at,
    };
  }

  async deleteTileset(id: number): Promise<void> {
    this.initializeTilethemeTables();
    this.db.prepare('DELETE FROM tilesets WHERE id = ?').run(id);
  }

  // ============================================================================
  // Tile Themes
  // ============================================================================

  async saveTileTheme(
    theme: Omit<TileTheme, 'id' | 'created_at' | 'updated_at'>
  ): Promise<number> {
    this.initializeTilethemeTables();

    const result = this.db
      .prepare(
        `INSERT INTO tile_themes (name, floor_config, wall_config, door_config)
         VALUES (?, ?, ?, ?)`
      )
      .run(
        theme.name,
        JSON.stringify(theme.floor),
        JSON.stringify(theme.wall),
        JSON.stringify(theme.door)
      );

    return result.lastInsertRowid as number;
  }

  async getTileThemes(): Promise<TileTheme[]> {
    this.initializeTilethemeTables();

    const rows = this.db
      .prepare('SELECT * FROM tile_themes ORDER BY updated_at DESC')
      .all() as Array<{
      id: number;
      name: string;
      floor_config: string;
      wall_config: string;
      door_config: string;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      floor: JSON.parse(row.floor_config),
      wall: JSON.parse(row.wall_config),
      door: JSON.parse(row.door_config),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async getTileTheme(id: number): Promise<TileTheme | null> {
    this.initializeTilethemeTables();

    const row = this.db.prepare('SELECT * FROM tile_themes WHERE id = ?').get(id) as {
      id: number;
      name: string;
      floor_config: string;
      wall_config: string;
      door_config: string;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      floor: JSON.parse(row.floor_config),
      wall: JSON.parse(row.wall_config),
      door: JSON.parse(row.door_config),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async updateTileTheme(id: number, updates: Partial<TileTheme>): Promise<void> {
    this.initializeTilethemeTables();

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.floor !== undefined) {
      fields.push('floor_config = ?');
      values.push(JSON.stringify(updates.floor));
    }
    if (updates.wall !== undefined) {
      fields.push('wall_config = ?');
      values.push(JSON.stringify(updates.wall));
    }
    if (updates.door !== undefined) {
      fields.push('door_config = ?');
      values.push(JSON.stringify(updates.door));
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db
      .prepare(`UPDATE tile_themes SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values);
  }

  async deleteTileTheme(id: number): Promise<void> {
    this.initializeTilethemeTables();
    this.db.prepare('DELETE FROM tile_themes WHERE id = ?').run(id);
  }

  // ============================================================================
  // Dungeon Themes
  // ============================================================================

  async saveDungeonTheme(
    theme: Omit<DungeonTheme, 'id' | 'created_at' | 'updated_at'>
  ): Promise<number> {
    this.initializeTilethemeTables();

    const result = this.db
      .prepare(
        `INSERT INTO dungeon_themes (name, dark_theme_id, light_theme_id)
         VALUES (?, ?, ?)`
      )
      .run(theme.name, theme.darkThemeId, theme.lightThemeId);

    return result.lastInsertRowid as number;
  }

  async getDungeonThemes(): Promise<DungeonTheme[]> {
    this.initializeTilethemeTables();

    const rows = this.db
      .prepare('SELECT * FROM dungeon_themes ORDER BY updated_at DESC')
      .all() as Array<{
      id: number;
      name: string;
      dark_theme_id: number;
      light_theme_id: number;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      darkThemeId: row.dark_theme_id,
      lightThemeId: row.light_theme_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async getDungeonTheme(id: number): Promise<DungeonTheme | null> {
    this.initializeTilethemeTables();

    const row = this.db
      .prepare('SELECT * FROM dungeon_themes WHERE id = ?')
      .get(id) as {
      id: number;
      name: string;
      dark_theme_id: number;
      light_theme_id: number;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      darkThemeId: row.dark_theme_id,
      lightThemeId: row.light_theme_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async updateDungeonTheme(id: number, updates: Partial<DungeonTheme>): Promise<void> {
    this.initializeTilethemeTables();

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.darkThemeId !== undefined) {
      fields.push('dark_theme_id = ?');
      values.push(updates.darkThemeId);
    }
    if (updates.lightThemeId !== undefined) {
      fields.push('light_theme_id = ?');
      values.push(updates.lightThemeId);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db
      .prepare(`UPDATE dungeon_themes SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values);
  }

  async deleteDungeonTheme(id: number): Promise<void> {
    this.initializeTilethemeTables();
    this.db.prepare('DELETE FROM dungeon_themes WHERE id = ?').run(id);
  }
}
