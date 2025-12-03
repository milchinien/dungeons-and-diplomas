/**
 * Statistics API endpoints
 */

import { get } from './client';

export interface QuestionStats {
  id: number;
  question: string;
  correct: number;
  wrong: number;
  timeout: number;
  elo: number;
}

export interface SubjectStats {
  subject_name: string;
  average_elo: number;
  questions: QuestionStats[];
}

export interface StatsData {
  [key: string]: SubjectStats;
}

export async function getStats(userId: number): Promise<StatsData> {
  return get<StatsData>(`/api/stats?userId=${userId}`);
}
