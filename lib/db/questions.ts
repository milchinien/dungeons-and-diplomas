/**
 * Question-related database operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from './adapters';
import type { SubjectEloScore } from '../types/api';

// Re-export type for convenience
export type { SubjectEloScore };

// Row types
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

// DTOs
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

/**
 * Get all questions grouped by subject
 */
export async function getAllQuestions(): Promise<QuestionDatabaseDTO> {
  const adapter = await getAdapter();
  return adapter.getAllQuestions();
}

/**
 * Get a question by ID
 */
export async function getQuestionById(id: number): Promise<QuestionRow | undefined> {
  const adapter = await getAdapter();
  return adapter.getQuestionById(id);
}

/**
 * Get all distinct subjects
 */
export async function getAllSubjects(): Promise<string[]> {
  const adapter = await getAdapter();
  return adapter.getAllSubjects();
}

/**
 * Get questions with ELO scores for a specific subject and user
 */
export async function getQuestionsWithEloBySubject(
  subjectKey: string,
  userId: number
): Promise<QuestionWithElo[]> {
  const adapter = await getAdapter();
  return adapter.getQuestionsWithEloBySubject(subjectKey, userId);
}

/**
 * Get average ELO per subject for session tracking
 */
export async function getSessionEloScores(userId: number): Promise<SubjectEloScore[]> {
  const adapter = await getAdapter();
  return adapter.getSessionEloScores(userId);
}
