/**
 * Centralized API client
 *
 * Usage:
 *   import { api } from '@/lib/api';
 *   const scores = await api.elo.getSessionElo(userId);
 */

import * as elo from './elo';
import * as questions from './questions';
import * as answers from './answers';
import * as xp from './xp';
import * as gold from './gold';
import * as auth from './auth';
import * as theme from './theme';
import * as stats from './stats';
import * as highscores from './highscores';

export const api = {
  elo,
  questions,
  answers,
  xp,
  gold,
  auth,
  theme,
  stats,
  highscores
};

// Re-export types for convenience
export type { SubjectEloScore } from './elo';
export type { AnswerLogEntry, LogAnswerResponse } from './answers';
export type { XpLogEntry, AddXpResponse } from './xp';
export type { GoldLogEntry, AddGoldResponse } from './gold';
export type { LoginRequest, LoginResponse } from './auth';
export type { ThemeResponse } from './theme';
export type { StatsData, SubjectStats, QuestionStats } from './stats';
export type { Highscore, SaveHighscoreRequest, SaveHighscoreResponse } from './highscores';
export { ApiError } from './client';

// Re-export validation utilities for API routes
export * from './validation';
