/**
 * Statistics-related database operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from './adapters';

/**
 * Statistics for a single question
 */
export interface QuestionStats {
  id: number;
  question: string;
  correct: number;
  wrong: number;
  timeout: number;
  elo: number;
}

/**
 * Statistics for a subject
 */
export interface SubjectStats {
  subject_name: string;
  questions: QuestionStats[];
  average_elo: number;
}

/**
 * Full user statistics grouped by subject
 */
export interface UserStats {
  [subjectKey: string]: SubjectStats;
}

/**
 * Get comprehensive user statistics grouped by subject
 *
 * This function:
 * 1. Fetches all answers for a user with question details
 * 2. Groups answers by question and calculates counts
 * 3. Calculates progressive ELO per question
 * 4. Groups by subject and calculates average ELO
 *
 * @param userId User ID to get stats for
 * @returns Statistics grouped by subject
 */
export async function getUserStats(userId: number): Promise<UserStats> {
  const adapter = await getAdapter();
  return adapter.getUserStats(userId);
}
