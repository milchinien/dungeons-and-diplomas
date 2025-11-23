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
import * as auth from './auth';
import * as theme from './theme';

export const api = {
  elo,
  questions,
  answers,
  xp,
  auth,
  theme
};

// Re-export types for convenience
export type { SubjectEloScore } from './elo';
export type { AnswerLogEntry, LogAnswerResponse } from './answers';
export type { XpLogEntry, AddXpResponse } from './xp';
export type { LoginRequest, LoginResponse } from './auth';
export type { ThemeResponse } from './theme';
export { ApiError } from './client';

// Re-export validation utilities for API routes
export * from './validation';
