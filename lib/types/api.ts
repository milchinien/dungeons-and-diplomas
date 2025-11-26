/**
 * Shared API types used across client and server
 *
 * This file consolidates type definitions to avoid duplication
 * between lib/api/ and lib/db/ modules.
 */

// ============================================================================
// Answer Types
// ============================================================================

export interface AnswerLogEntry {
  user_id: number;
  question_id: number;
  selected_answer_index: number;
  is_correct: boolean;
  answer_time_ms?: number;
  timeout_occurred?: boolean;
}

export interface LogAnswerResponse {
  success: boolean;
}

// ============================================================================
// ELO Types
// ============================================================================

export interface SubjectEloScore {
  subjectKey: string;
  subjectName: string;
  averageElo: number;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface LoginRequest {
  username: string;
}

export interface LoginResponse {
  id: number;
  username: string;
  xp?: number;
}

// ============================================================================
// XP Types
// ============================================================================

export interface XpLogEntry {
  user_id: number;
  xp_amount: number;
  reason: string;
  enemy_level?: number;
}

export interface AddXpResponse {
  success: boolean;
  user: {
    id: number;
    username: string;
    xp: number;
  };
}
