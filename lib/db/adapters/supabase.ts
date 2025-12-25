/**
 * Supabase Database Adapter
 *
 * Uses Supabase client for PostgreSQL operations.
 * All methods are natively async.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
 * Supabase adapter implementation
 */
export class SupabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Use service role key if available, otherwise fall back to anon key
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        'Supabase environment variables not configured. ' +
        'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }

    this.client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // ============================================================================
  // Users
  // ============================================================================

  async loginUser(username: string): Promise<User> {
    // Case-insensitive lookup using ILIKE
    const { data: existingUser } = await this.client
      .from('users')
      .select('*')
      .ilike('username', username)
      .single();

    if (existingUser) {
      // Update last_login
      await this.client
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', existingUser.id);

      return this.mapUser(existingUser);
    }

    // Create new user
    const { data: newUser, error } = await this.client
      .from('users')
      .insert({ username })
      .select()
      .single();

    if (error) throw error;
    return this.mapUser(newUser);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const { data } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    return data ? this.mapUser(data) : undefined;
  }

  private mapUser(row: Record<string, unknown>): User {
    return {
      id: Number(row.id),
      username: String(row.username),
      xp: Number(row.xp || 0),
      created_at: String(row.created_at),
      last_login: String(row.last_login),
    };
  }

  // ============================================================================
  // Questions
  // ============================================================================

  async getAllQuestions(): Promise<QuestionDatabaseDTO> {
    const { data: rows, error } = await this.client
      .from('questions')
      .select('*')
      .order('id');

    if (error) throw error;

    const result: QuestionDatabaseDTO = {};

    for (const row of rows || []) {
      const subjectKey = String(row.subject_key);
      if (!result[subjectKey]) {
        result[subjectKey] = {
          subject: String(row.subject_name),
          questions: [],
        };
      }

      result[subjectKey].questions.push({
        id: Number(row.id),
        question: String(row.question),
        answers: row.answers as string[],
        correct: Number(row.correct_index),
      });
    }

    return result;
  }

  async getQuestionById(id: number): Promise<QuestionRow | undefined> {
    const { data } = await this.client
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (!data) return undefined;

    return {
      id: Number(data.id),
      subject_key: String(data.subject_key),
      subject_name: String(data.subject_name),
      question: String(data.question),
      answers: JSON.stringify(data.answers),
      correct_index: Number(data.correct_index),
      difficulty: Number(data.difficulty),
      created_at: String(data.created_at),
    };
  }

  async getAllSubjects(): Promise<string[]> {
    const { data, error } = await this.client
      .from('questions')
      .select('subject_key');

    if (error) throw error;

    // Get distinct subjects
    const subjects = new Set<string>();
    for (const row of data || []) {
      subjects.add(String(row.subject_key));
    }

    return Array.from(subjects);
  }

  async getQuestionsWithEloBySubject(
    subjectKey: string,
    userId: number
  ): Promise<QuestionWithElo[]> {
    // Get questions for this subject
    const { data: questions, error: qError } = await this.client
      .from('questions')
      .select('id, question, answers, correct_index')
      .eq('subject_key', subjectKey)
      .order('id');

    if (qError) throw qError;

    // Get all answers for this user for these questions
    const questionIds = (questions || []).map((q) => Number(q.id));
    const { data: answers, error: aError } = await this.client
      .from('answer_log')
      .select('question_id, is_correct, timeout_occurred')
      .eq('user_id', userId)
      .in('question_id', questionIds)
      .order('answered_at');

    if (aError) throw aError;

    // Group answers by question
    const answersByQuestion = new Map<number, AnswerRecord[]>();
    for (const answer of answers || []) {
      const qId = Number(answer.question_id);
      if (!answersByQuestion.has(qId)) {
        answersByQuestion.set(qId, []);
      }
      answersByQuestion.get(qId)!.push({
        is_correct: Boolean(answer.is_correct),
        timeout_occurred: Boolean(answer.timeout_occurred),
      });
    }

    return (questions || []).map((q) => {
      const qAnswers = answersByQuestion.get(Number(q.id)) || [];
      const elo = calculateEloOrNull(qAnswers);
      const correctCount = qAnswers.filter((a) => a.is_correct).length;
      const wrongCount = qAnswers.filter((a) => !a.is_correct && !a.timeout_occurred).length;
      const timeoutCount = qAnswers.filter((a) => a.timeout_occurred).length;

      return {
        id: Number(q.id),
        question: String(q.question),
        answers: q.answers as string[],
        correct: Number(q.correct_index),
        elo,
        correctCount,
        wrongCount,
        timeoutCount,
      };
    });
  }

  async getSessionEloScores(userId: number): Promise<SubjectEloScore[]> {
    // Get all questions
    const { data: questions, error: qError } = await this.client
      .from('questions')
      .select('id, subject_key, subject_name')
      .order('subject_key')
      .order('id');

    if (qError) throw qError;

    // Get all answers for this user
    const { data: answers, error: aError } = await this.client
      .from('answer_log')
      .select('question_id, is_correct, timeout_occurred')
      .eq('user_id', userId)
      .order('question_id')
      .order('answered_at');

    if (aError) throw aError;

    // Group answers by question
    const answersByQuestion = new Map<number, AnswerRecord[]>();
    for (const answer of answers || []) {
      const qId = Number(answer.question_id);
      if (!answersByQuestion.has(qId)) {
        answersByQuestion.set(qId, []);
      }
      answersByQuestion.get(qId)!.push({
        is_correct: Boolean(answer.is_correct),
        timeout_occurred: Boolean(answer.timeout_occurred),
      });
    }

    // Calculate ELO per subject
    const subjectElos: { [key: string]: { name: string; elos: number[] } } = {};

    for (const q of questions || []) {
      const subjectKey = String(q.subject_key);
      if (!subjectElos[subjectKey]) {
        subjectElos[subjectKey] = { name: String(q.subject_name), elos: [] };
      }

      const qAnswers = answersByQuestion.get(Number(q.id)) || [];
      const elo = qAnswers.length > 0 ? calculateProgressiveElo(qAnswers) : 5;
      subjectElos[subjectKey].elos.push(elo);
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
    const { error } = await this.client.from('answer_log').insert({
      user_id: entry.user_id,
      question_id: entry.question_id,
      selected_answer_index: entry.selected_answer_index,
      is_correct: entry.is_correct,
      answer_time_ms: entry.answer_time_ms || null,
      timeout_occurred: entry.timeout_occurred || false,
    });

    if (error) throw error;
  }

  // ============================================================================
  // XP
  // ============================================================================

  async addXp(entry: XpLogEntry): Promise<void> {
    // Log the XP gain
    const { error: logError } = await this.client.from('xp_log').insert({
      user_id: entry.user_id,
      xp_amount: entry.xp_amount,
      reason: entry.reason,
      enemy_level: entry.enemy_level || null,
    });

    if (logError) throw logError;

    // Update user's total XP using RPC for atomic increment
    const { data: user } = await this.client
      .from('users')
      .select('xp')
      .eq('id', entry.user_id)
      .single();

    if (user) {
      const { error: updateError } = await this.client
        .from('users')
        .update({ xp: Number(user.xp) + entry.xp_amount })
        .eq('id', entry.user_id);

      if (updateError) throw updateError;
    }
  }

  // ============================================================================
  // Stats
  // ============================================================================

  async getUserStats(userId: number): Promise<UserStats> {
    // Get all answers for this user with question details via join
    const { data: rows, error } = await this.client
      .from('answer_log')
      .select(
        `
        question_id,
        is_correct,
        timeout_occurred,
        answered_at,
        questions!inner (
          id,
          subject_key,
          subject_name,
          question
        )
      `
      )
      .eq('user_id', userId)
      .order('answered_at');

    if (error) throw error;

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

    for (const row of rows || []) {
      const q = row.questions as unknown as Record<string, unknown>;
      const qId = Number(q.id);

      if (!questionStats.has(qId)) {
        questionStats.set(qId, {
          id: qId,
          subject_key: String(q.subject_key),
          subject_name: String(q.subject_name),
          question: String(q.question),
          answers: [],
          correct: 0,
          wrong: 0,
          timeout: 0,
        });
      }

      const stats = questionStats.get(qId)!;
      const isCorrect = Boolean(row.is_correct);
      const isTimeout = Boolean(row.timeout_occurred);

      stats.answers.push({
        is_correct: isCorrect,
        timeout_occurred: isTimeout,
      });

      if (isTimeout) {
        stats.timeout++;
      } else if (isCorrect) {
        stats.correct++;
      } else {
        stats.wrong++;
      }
    }

    // Group by subject
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
    const { data, error } = await this.client
      .from('highscores')
      .insert({
        user_id: entry.user_id,
        score: entry.score,
        enemies_defeated: entry.enemies_defeated,
        rooms_explored: entry.rooms_explored,
        xp_gained: entry.xp_gained,
        max_combo: entry.max_combo,
        play_time_seconds: entry.play_time_seconds,
      })
      .select(
        `
        *,
        users!inner (username)
      `
      )
      .single();

    if (error) throw error;

    return this.mapHighscore(data);
  }

  async getTopHighscores(limit: number = 10): Promise<Highscore[]> {
    const { data, error } = await this.client
      .from('highscores')
      .select(
        `
        *,
        users!inner (username)
      `
      )
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row) => this.mapHighscore(row));
  }

  async getUserHighscores(userId: number, limit: number = 10): Promise<Highscore[]> {
    const { data, error } = await this.client
      .from('highscores')
      .select(
        `
        *,
        users!inner (username)
      `
      )
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row) => this.mapHighscore(row));
  }

  async getScoreRank(score: number): Promise<number> {
    const { count, error } = await this.client
      .from('highscores')
      .select('*', { count: 'exact', head: true })
      .gt('score', score);

    if (error) throw error;

    return (count || 0) + 1;
  }

  async isPersonalBest(userId: number, score: number): Promise<boolean> {
    const { data, error } = await this.client
      .from('highscores')
      .select('score')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    return !data || score > Number(data.score);
  }

  private mapHighscore(row: Record<string, unknown>): Highscore {
    const user = row.users as Record<string, unknown>;
    return {
      id: Number(row.id),
      user_id: Number(row.user_id),
      username: String(user.username),
      score: Number(row.score),
      enemies_defeated: Number(row.enemies_defeated),
      rooms_explored: Number(row.rooms_explored),
      xp_gained: Number(row.xp_gained),
      max_combo: Number(row.max_combo),
      play_time_seconds: Number(row.play_time_seconds),
      created_at: String(row.created_at),
    };
  }

  // ============================================================================
  // Editor Levels
  // ============================================================================

  async saveEditorLevel(level: EditorLevel): Promise<number> {
    const { data, error } = await this.client
      .from('editor_levels')
      .insert({
        name: level.name,
        structure_seed: level.structure_seed,
        decoration_seed: level.decoration_seed,
        spawn_seed: level.spawn_seed,
        width: level.width,
        height: level.height,
        algorithm: level.algorithm,
        created_by: level.created_by || null,
        notes: level.notes || null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return Number(data.id);
  }

  async getEditorLevels(userId?: number): Promise<EditorLevel[]> {
    let query = this.client
      .from('editor_levels')
      .select('*')
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('created_by', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((row) => this.mapEditorLevel(row));
  }

  async getEditorLevel(id: number): Promise<EditorLevel | null> {
    const { data, error } = await this.client
      .from('editor_levels')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data ? this.mapEditorLevel(data) : null;
  }

  async updateEditorLevel(id: number, updates: Partial<EditorLevel>): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.structure_seed !== undefined) updateData.structure_seed = updates.structure_seed;
    if (updates.decoration_seed !== undefined)
      updateData.decoration_seed = updates.decoration_seed;
    if (updates.spawn_seed !== undefined) updateData.spawn_seed = updates.spawn_seed;
    if (updates.width !== undefined) updateData.width = updates.width;
    if (updates.height !== undefined) updateData.height = updates.height;
    if (updates.algorithm !== undefined) updateData.algorithm = updates.algorithm;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    if (Object.keys(updateData).length === 0) return;

    const { error } = await this.client
      .from('editor_levels')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  async deleteEditorLevel(id: number): Promise<void> {
    const { error } = await this.client.from('editor_levels').delete().eq('id', id);

    if (error) throw error;
  }

  private mapEditorLevel(row: Record<string, unknown>): EditorLevel {
    return {
      id: Number(row.id),
      name: String(row.name),
      structure_seed: Number(row.structure_seed),
      decoration_seed: Number(row.decoration_seed),
      spawn_seed: Number(row.spawn_seed),
      width: Number(row.width),
      height: Number(row.height),
      algorithm: Number(row.algorithm),
      created_by: row.created_by ? Number(row.created_by) : undefined,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      notes: row.notes ? String(row.notes) : undefined,
    };
  }

  // ============================================================================
  // Tilesets
  // ============================================================================

  async saveTileset(tileset: Omit<ImportedTileset, 'id' | 'created_at'>): Promise<number> {
    const { data, error } = await this.client
      .from('tilesets')
      .insert({
        name: tileset.name,
        path: tileset.path,
        width_tiles: tileset.widthTiles,
        height_tiles: tileset.heightTiles,
      })
      .select('id')
      .single();

    if (error) throw error;
    return Number(data.id);
  }

  async getTilesets(): Promise<ImportedTileset[]> {
    const { data, error } = await this.client
      .from('tilesets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      path: String(row.path),
      widthTiles: Number(row.width_tiles),
      heightTiles: Number(row.height_tiles),
      created_at: String(row.created_at),
    }));
  }

  async getTileset(id: number): Promise<ImportedTileset | null> {
    const { data, error } = await this.client
      .from('tilesets')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return null;

    return {
      id: Number(data.id),
      name: String(data.name),
      path: String(data.path),
      widthTiles: Number(data.width_tiles),
      heightTiles: Number(data.height_tiles),
      created_at: String(data.created_at),
    };
  }

  async deleteTileset(id: number): Promise<void> {
    const { error } = await this.client.from('tilesets').delete().eq('id', id);

    if (error) throw error;
  }

  // ============================================================================
  // Tile Themes
  // ============================================================================

  async saveTileTheme(
    theme: Omit<TileTheme, 'id' | 'created_at' | 'updated_at'>
  ): Promise<number> {
    const { data, error } = await this.client
      .from('tile_themes')
      .insert({
        name: theme.name,
        floor_config: theme.floor,
        wall_config: theme.wall,
        door_config: theme.door,
      })
      .select('id')
      .single();

    if (error) throw error;
    return Number(data.id);
  }

  async getTileThemes(): Promise<TileTheme[]> {
    const { data, error } = await this.client
      .from('tile_themes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      floor: row.floor_config as TileTheme['floor'],
      wall: row.wall_config as TileTheme['wall'],
      door: row.door_config as TileTheme['door'],
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async getTileTheme(id: number): Promise<TileTheme | null> {
    const { data, error } = await this.client
      .from('tile_themes')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return null;

    return {
      id: Number(data.id),
      name: String(data.name),
      floor: data.floor_config as TileTheme['floor'],
      wall: data.wall_config as TileTheme['wall'],
      door: data.door_config as TileTheme['door'],
      created_at: String(data.created_at),
      updated_at: String(data.updated_at),
    };
  }

  async updateTileTheme(id: number, updates: Partial<TileTheme>): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.floor !== undefined) updateData.floor_config = updates.floor;
    if (updates.wall !== undefined) updateData.wall_config = updates.wall;
    if (updates.door !== undefined) updateData.door_config = updates.door;

    if (Object.keys(updateData).length === 0) return;

    const { error } = await this.client.from('tile_themes').update(updateData).eq('id', id);

    if (error) throw error;
  }

  async deleteTileTheme(id: number): Promise<void> {
    const { error } = await this.client.from('tile_themes').delete().eq('id', id);

    if (error) throw error;
  }

  // ============================================================================
  // Dungeon Themes
  // ============================================================================

  async saveDungeonTheme(
    theme: Omit<DungeonTheme, 'id' | 'created_at' | 'updated_at'>
  ): Promise<number> {
    const { data, error } = await this.client
      .from('dungeon_themes')
      .insert({
        name: theme.name,
        dark_theme_id: theme.darkThemeId,
        light_theme_id: theme.lightThemeId,
      })
      .select('id')
      .single();

    if (error) throw error;
    return Number(data.id);
  }

  async getDungeonThemes(): Promise<DungeonTheme[]> {
    const { data, error } = await this.client
      .from('dungeon_themes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      darkThemeId: Number(row.dark_theme_id),
      lightThemeId: Number(row.light_theme_id),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  }

  async getDungeonTheme(id: number): Promise<DungeonTheme | null> {
    const { data, error } = await this.client
      .from('dungeon_themes')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return null;

    return {
      id: Number(data.id),
      name: String(data.name),
      darkThemeId: Number(data.dark_theme_id),
      lightThemeId: Number(data.light_theme_id),
      created_at: String(data.created_at),
      updated_at: String(data.updated_at),
    };
  }

  async updateDungeonTheme(id: number, updates: Partial<DungeonTheme>): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.darkThemeId !== undefined) updateData.dark_theme_id = updates.darkThemeId;
    if (updates.lightThemeId !== undefined) updateData.light_theme_id = updates.lightThemeId;

    if (Object.keys(updateData).length === 0) return;

    const { error } = await this.client.from('dungeon_themes').update(updateData).eq('id', id);

    if (error) throw error;
  }

  async deleteDungeonTheme(id: number): Promise<void> {
    const { error } = await this.client.from('dungeon_themes').delete().eq('id', id);

    if (error) throw error;
  }
}
